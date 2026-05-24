import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const routerFile = path.join(repoRoot, 'src', 'router', 'index.tsx')
const sidebarFile = path.join(repoRoot, 'src', 'components', 'Sidebar.tsx')
const srcDir = path.join(repoRoot, 'src')

const readSourceFile = (filePath) => {
  const source = fs.readFileSync(filePath, 'utf8')
  return ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
}

const unwrap = (node) => {
  let current = node
  while (
    current &&
    (ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) ||
      ts.isSatisfiesExpression?.(current) ||
      ts.isTypeAssertionExpression(current))
  ) {
    current = current.expression
  }
  return current
}

const findVariable = (sourceFile, variableName) => {
  let found

  const visit = (node) => {
    if (found) return

    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === variableName) {
      found = node
      return
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return found
}

const propertyNameText = (name) => {
  if (!name) return undefined
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
  return undefined
}

const getProperty = (objectLiteral, propertyName) =>
  objectLiteral.properties.find(
    (property) => ts.isPropertyAssignment(property) && propertyNameText(property.name) === propertyName,
  )

const stringLiteralValue = (node) => {
  const expression = unwrap(node)
  if (expression && (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression))) {
    return expression.text
  }
  return undefined
}

const returnedExpression = (declaration) => {
  const initializer = unwrap(declaration.initializer)
  if (!initializer) return undefined

  if (ts.isCallExpression(initializer)) {
    const firstArg = initializer.arguments[0]
    if (firstArg && ts.isArrowFunction(firstArg)) return unwrap(firstArg.body)
  }

  return initializer
}

const normalizePath = (value) => {
  let normalized = value.replace(/\\/g, '/').replace(/\/+/g, '/')
  if (!normalized.startsWith('/')) normalized = `/${normalized}`
  if (normalized.length > 1 && normalized.endsWith('/')) normalized = normalized.slice(0, -1)
  return normalized
}

const joinRoutePath = (parentPath, routePath) => {
  if (!routePath) return normalizePath(parentPath || '/')
  if (routePath.startsWith('/')) return normalizePath(routePath)

  const base = !parentPath || parentPath === '/' ? '' : parentPath
  return normalizePath(`${base}/${routePath}`)
}

const collectRouterPaths = (routesArray) => {
  const paths = new Set()

  const visitRouteArray = (arrayExpression, parentPath) => {
    for (const element of arrayExpression.elements) {
      const route = unwrap(element)
      if (!route || !ts.isObjectLiteralExpression(route)) continue

      const pathProperty = getProperty(route, 'path')
      const indexProperty = getProperty(route, 'index')
      const childrenProperty = getProperty(route, 'children')

      const routePath = pathProperty ? stringLiteralValue(pathProperty.initializer) : undefined
      const isIndexRoute = indexProperty && indexProperty.initializer.kind === ts.SyntaxKind.TrueKeyword
      const fullPath = routePath && routePath !== '*' ? joinRoutePath(parentPath, routePath) : parentPath

      if (isIndexRoute) paths.add(normalizePath(parentPath || '/'))
      if (routePath && routePath !== '*') paths.add(fullPath)

      const children = childrenProperty ? unwrap(childrenProperty.initializer) : undefined
      if (children && ts.isArrayLiteralExpression(children)) {
        visitRouteArray(children, fullPath || parentPath)
      }
    }
  }

  visitRouteArray(routesArray, '')
  return paths
}

const collectPathMap = (sidebarSource) => {
  const declaration = findVariable(sidebarSource, 'PATH_MAP')
  const expression = declaration ? returnedExpression(declaration) : undefined
  const pathMap = new Map()

  if (!expression || !ts.isObjectLiteralExpression(expression)) return pathMap

  for (const property of expression.properties) {
    if (!ts.isPropertyAssignment(property)) continue

    const key = propertyNameText(property.name)
    const value = stringLiteralValue(property.initializer)

    if (key && value?.startsWith('/')) pathMap.set(key, normalizePath(value))
  }

  return pathMap
}

const collectSidebarLeafIds = (sidebarSource) => {
  const declaration = findVariable(sidebarSource, 'menuItems')
  const expression = declaration ? returnedExpression(declaration) : undefined
  const leafIds = new Set()

  if (!expression || !ts.isArrayLiteralExpression(expression)) return leafIds

  const visitMenuArray = (arrayExpression) => {
    for (const element of arrayExpression.elements) {
      const item = unwrap(element)
      if (!item || !ts.isObjectLiteralExpression(item)) continue

      const idProperty = getProperty(item, 'id')
      const childrenProperty = getProperty(item, 'children')
      const id = idProperty ? stringLiteralValue(idProperty.initializer) : undefined
      const children = childrenProperty ? unwrap(childrenProperty.initializer) : undefined

      if (children && ts.isArrayLiteralExpression(children)) {
        visitMenuArray(children)
      } else if (id) {
        leafIds.add(id)
      }
    }
  }

  visitMenuArray(expression)
  return leafIds
}

const collectSourceFiles = (dir) => {
  const files = []

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(entryPath))
      continue
    }

    if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) files.push(entryPath)
  }

  return files
}

const normalizeNavigationPath = (value) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return undefined

  const withoutQuery = value.split(/[?#]/)[0]
  if (!withoutQuery) return '/'

  return normalizePath(withoutQuery)
}

const expressionText = (node, sourceFile) => node.getText(sourceFile)

const isStaticNavigationAttribute = (name) => name === 'to' || name === 'href'

const collectStaticNavigationPaths = (sourceFiles) => {
  const paths = []

  for (const filePath of sourceFiles) {
    const sourceFile = readSourceFile(filePath)

    const add = (rawPath, node) => {
      const navigationPath = normalizeNavigationPath(rawPath)
      if (!navigationPath) return

      const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
      paths.push({
        path: navigationPath,
        filePath,
        line: position.line + 1,
        column: position.character + 1,
      })
    }

    const visit = (node) => {
      if (ts.isCallExpression(node)) {
        const callee = unwrap(node.expression)
        const firstArg = node.arguments[0]

        if (callee && ts.isIdentifier(callee) && callee.text === 'navigate' && firstArg) {
          const value = stringLiteralValue(firstArg)
          if (value) add(value, firstArg)
        }
      }

      if (ts.isJsxAttribute(node)) {
        const name = propertyNameText(node.name)

        if (isStaticNavigationAttribute(name)) {
          if (ts.isStringLiteral(node.initializer)) {
            add(node.initializer.text, node.initializer)
          } else if (node.initializer && ts.isJsxExpression(node.initializer)) {
            const value = node.initializer.expression ? stringLiteralValue(node.initializer.expression) : undefined
            if (value) add(value, node.initializer)
          }
        }
      }

      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        const left = expressionText(node.left, sourceFile)
        const value = stringLiteralValue(node.right)

        if ((left === 'window.location.href' || left === 'location.href') && value) {
          add(value, node.right)
        }
      }

      ts.forEachChild(node, visit)
    }

    visit(sourceFile)
  }

  return paths
}

const escapeRegex = (value) => value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')

const routeMatchesPath = (routePattern, pathToCheck) => {
  if (routePattern === pathToCheck) return true
  if (!routePattern.includes(':')) return false

  const regex = new RegExp(
    `^${routePattern
      .split('/')
      .map((segment) => (segment.startsWith(':') ? '[^/]+' : escapeRegex(segment)))
      .join('/')}$`,
  )

  return regex.test(pathToCheck)
}

const routerSource = readSourceFile(routerFile)
const sidebarSource = readSourceFile(sidebarFile)
const routesDeclaration = findVariable(routerSource, 'routes')
const routesExpression = routesDeclaration ? unwrap(routesDeclaration.initializer) : undefined

if (!routesExpression || !ts.isArrayLiteralExpression(routesExpression)) {
  console.error('Could not find the routes array in src/router/index.tsx.')
  process.exit(1)
}

const routerPaths = collectRouterPaths(routesExpression)
const pathMap = collectPathMap(sidebarSource)
const leafIds = collectSidebarLeafIds(sidebarSource)
const staticNavigationPaths = collectStaticNavigationPaths(collectSourceFiles(srcDir))

const hasMatchingRoute = (pathToCheck) =>
  [...routerPaths].some((routePath) => routeMatchesPath(routePath, pathToCheck))

const missingPathMapEntries = [...leafIds].filter((id) => !pathMap.has(id))
const missingRoutes = [...pathMap.entries()].filter(([, menuPath]) => {
  return !hasMatchingRoute(menuPath)
})
const missingStaticNavigationRoutes = staticNavigationPaths.filter((navigation) => {
  return !hasMatchingRoute(navigation.path)
})

if (missingPathMapEntries.length || missingRoutes.length || missingStaticNavigationRoutes.length) {
  if (missingPathMapEntries.length) {
    console.error('Sidebar leaf menu items without PATH_MAP entries:')
    for (const id of missingPathMapEntries) console.error(`- ${id}`)
  }

  if (missingRoutes.length) {
    console.error('PATH_MAP entries without matching router paths:')
    for (const [id, menuPath] of missingRoutes) console.error(`- ${id}: ${menuPath}`)
  }

  if (missingStaticNavigationRoutes.length) {
    console.error('Static in-app navigation targets without matching router paths:')
    for (const navigation of missingStaticNavigationRoutes) {
      const relativePath = path.relative(repoRoot, navigation.filePath).replace(/\\/g, '/')
      console.error(`- ${navigation.path} (${relativePath}:${navigation.line}:${navigation.column})`)
    }
  }

  process.exit(1)
}

console.log(
  `Route check passed: ${pathMap.size} sidebar paths and ${staticNavigationPaths.length} static navigation targets match router entries.`,
)
