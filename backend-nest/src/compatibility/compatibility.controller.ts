import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const COMPATIBILITY_MODULES = [
  'deviations',
  'change-control',
  'control-plans',
  'inspections',
  'calibrations',
  'defect-logs',
] as const;

type CompatibilityModule = (typeof COMPATIBILITY_MODULES)[number];

@Controller()
@UseGuards(JwtAuthGuard)
export class CompatibilityController {
  private readonly records = new Map<CompatibilityModule, Map<string, Record<string, unknown>>>();

  @Get([...COMPATIBILITY_MODULES])
  list(@Req() req: any) {
    const module = this.getModule(req);
    const items = Array.from(this.getStore(module).values());

    return {
      data: items,
      total: items.length,
      page: 1,
      limit: Math.max(items.length, 20),
      totalPages: 1,
    };
  }

  @Get(COMPATIBILITY_MODULES.map((module) => `${module}/:id`))
  findOne(@Req() req: any, @Param('id') id: string) {
    const module = this.getModule(req);
    const record = this.getStore(module).get(id);

    return {
      data: record ?? null,
    };
  }

  @Post([...COMPATIBILITY_MODULES])
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: any, @Body() body: Record<string, unknown>) {
    const module = this.getModule(req);
    const id = typeof body.id === 'string' ? body.id : `${module}-${Date.now()}`;
    const record = {
      ...body,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.getStore(module).set(id, record);
    return { data: record };
  }

  @Patch(COMPATIBILITY_MODULES.map((module) => `${module}/:id`))
  update(@Req() req: any, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    const module = this.getModule(req);
    const store = this.getStore(module);
    const current = store.get(id) ?? { id, createdAt: new Date().toISOString() };
    const record = {
      ...current,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    store.set(id, record);
    return { data: record };
  }

  @Delete(COMPATIBILITY_MODULES.map((module) => `${module}/:id`))
  @HttpCode(HttpStatus.OK)
  remove(@Req() req: any, @Param('id') id: string) {
    const module = this.getModule(req);
    this.getStore(module).delete(id);
    return { id, message: 'Record deleted successfully' };
  }

  private getModule(req: any): CompatibilityModule {
    const parts = String(req.path || '')
      .split('/')
      .filter(Boolean);
    const module = parts.find((part) =>
      (COMPATIBILITY_MODULES as readonly string[]).includes(part),
    );

    if (!module) {
      throw new Error('Unsupported compatibility module');
    }

    return module as CompatibilityModule;
  }

  private getStore(module: CompatibilityModule) {
    if (!this.records.has(module)) {
      this.records.set(module, new Map());
    }
    return this.records.get(module)!;
  }
}
