/**
 * QMS Enterprise 4.0 - Formula Expression Evaluator
 * Evaluates mathematical and logical expressions with field references
 */

export interface EvaluationContext {
  [fieldName: string]: unknown;
  __dataSources?: any[];
}

export class FormulaEvaluator {
  private context: EvaluationContext;

  constructor(context: EvaluationContext = {}) {
    this.context = context;
  }

  /**
   * Set the evaluation context (field values)
   */
  setContext(context: EvaluationContext) {
    this.context = context;
  }

  /**
   * Evaluate a formula expression
   */
  evaluate(expression: string): number | string | boolean | null {
    if (!expression || expression.trim() === '') return null;
    try {
      // Replace field references @fieldName with actual values
      const processedExpression = this.preProcessExpression(expression);
      
      // Evaluate the expression
      return this.executeExpression(processedExpression);
    } catch (error) {
      console.error('Formula evaluation error:', error, 'Expression:', expression);
      return null;
    }
  }

  /**
   * Pre-process expression to replace field references and functions
   */
  private preProcessExpression(expression: string): string {
    let processed = expression;

    // Replace field references: @fieldName → context value
    processed = processed.replace(/@(\w+)/g, (_match, fieldName) => {
      const value = this.context[fieldName];
      if (value === undefined || value === null) {
        return '0';
      }
      if (typeof value === 'string') {
        return `'${value}'`;
      }
      return String(value);
    });

    // Convert functions to JavaScript equivalents
    processed = this.convertFunctions(processed);

    return processed;
  }

  /**
   * Convert formula functions to JavaScript
   */
  private convertFunctions(expression: string): string {
    let processed = expression;

    // SUM function: SUM(@field1, @field2, ...) → (field1 + field2 + ...)
    processed = processed.replace(/SUM\(([^)]+)\)/gi, (_match, args) => {
      const argList = args.split(',').map((a: string) => a.trim()).filter(Boolean);
      return `(${argList.join(' + ')})`;
    });

    // AVG function: AVG(@field1, @field2) → ((field1 + field2) / count)
    processed = processed.replace(/AVG\(([^)]+)\)/gi, (_match, args) => {
      const argList = args.split(',').map((a: string) => a.trim()).filter(Boolean);
      return `(${argList.join(' + ')}) / ${argList.length}`;
    });

    // MIN function
    processed = processed.replace(/MIN\(([^)]+)\)/gi, (_match, args) => {
      return `Math.min(${args})`;
    });

    // MAX function
    processed = processed.replace(/MAX\(([^)]+)\)/gi, (_match, args) => {
      return `Math.max(${args})`;
    });

    // ABS function
    processed = processed.replace(/ABS\(([^)]+)\)/gi, (_match, arg) => {
      return `Math.abs(${arg})`;
    });

    // COUNT function
    processed = processed.replace(/COUNT\(([^)]+)\)/gi, (_match, args) => {
      const argList = args.split(',').map((a: string) => a.trim()).filter(Boolean);
      return String(argList.length);
    });

    // ROUND function
    processed = processed.replace(/ROUND\(([^)]+)\)/gi, (_match, args) => {
      const [value, decimals = 0] = args.split(',').map((a: string) => a.trim());
      return `Math.round(${value} * Math.pow(10, ${decimals})) / Math.pow(10, ${decimals})`;
    });

    // CONCAT function
    processed = processed.replace(/CONCAT\(([^)]+)\)/gi, (_match, args) => {
      const argList = args.split(',').map((a: string) => a.trim()).filter(Boolean);
      return argList.join(' + ');
    });

    // LENGTH function
    processed = processed.replace(/LENGTH\(([^)]+)\)/gi, (_match, arg) => {
      return `String(${arg}).length`;
    });

    // UPPER/LOWER functions
    processed = processed.replace(/UPPER\(([^)]+)\)/gi, (_match, arg) => {
      return `String(${arg}).toUpperCase()`;
    });
    processed = processed.replace(/LOWER\(([^)]+)\)/gi, (_match, arg) => {
      return `String(${arg}).toLowerCase()`;
    });

    // IF function: IF(condition, trueValue, falseValue)
    processed = processed.replace(/IF\(([^,]+),\s*([^,]+),\s*([^)]+)\)/gi, 
      (_match, condition, trueVal, falseVal) => {
        return `(${condition} ? ${trueVal} : ${falseVal})`;
      }
    );

    // VLOOKUP function: VLOOKUP(searchValue, dataSourceId, matchField, resultField)
    processed = processed.replace(/VLOOKUP\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/gi, 
      (_match, searchValue, dsId, matchF, resultF) => {
        return `VLOOKUP(${searchValue}, ${dsId}, ${matchF}, ${resultF})`;
      }
    );

    // IS_EMPTY function
    processed = processed.replace(/IS_EMPTY\(([^)]+)\)/gi, (_match, arg) => {
      return `(!${arg} || String(${arg}).trim() === '')`;
    });

    // Convert AND/OR/NOT to &&/||/!
    processed = processed.replace(/\bAND\b/gi, '&&');
    processed = processed.replace(/\bOR\b/gi, '||');
    processed = processed.replace(/\bNOT\b/gi, '!');

    return processed;
  }

  /**
   * Execute the processed expression safely
   */
  private executeExpression(expression: string): number | string | boolean | null {
    try {
      const { __dataSources = [] } = this.context;

      // Define internal helper functions for the formula scope
      const VLOOKUP = (searchValue: any, dataSourceId: string, matchField: string, resultField: string) => {
        const ds = __dataSources.find((s: any) => s.id === dataSourceId || s.name === dataSourceId);
        if (!ds || !ds.data) return null;
        
        const found = ds.data.find((row: any) => row[matchField] == searchValue);
        return found ? found[resultField] : null;
      };

      // Create evaluation scope
      const scope = {
        Math,
        VLOOKUP,
        ...this.context
      };

      // Use Function constructor for safer evaluation than eval()
      const keys = Object.keys(scope);
      const values = Object.values(scope);
      
      const func = new Function(...keys, `"use strict"; return (${expression})`);
      const result = func(...values);
      if (typeof result === 'number' && !Number.isFinite(result)) return 0;
      return result;
    } catch (error) {
      console.error('Execution error:', error, 'Expression:', expression);
      return null;
    }
  }

  /**
   * Extract variable names from expression
   */
  static extractVariables(expression: string): string[] {
    const regex = /@(\w+)/g;
    const variables: string[] = [];
    let match;
    
    while ((match = regex.exec(expression)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  }

  /**
   * Validate formula syntax
   */
  static validate(expression: string): { valid: boolean; error?: string } {
    try {
      // Check for balanced parentheses
      let parentheses = 0;
      for (const char of expression) {
        if (char === '(') parentheses++;
        if (char === ')') parentheses--;
        if (parentheses < 0) {
          return { valid: false, error: 'Unbalanced parentheses' };
        }
      }
      if (parentheses !== 0) {
        return { valid: false, error: 'Unbalanced parentheses' };
      }

      // Test with empty context
      const evaluator = new FormulaEvaluator({});
      evaluator.evaluate(expression);

      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Invalid formula' 
      };
    }
  }
}

export default FormulaEvaluator;
