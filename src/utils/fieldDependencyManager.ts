/**
 * QMS Enterprise 4.0 - Field Dependency Manager
 * Handles field dependencies, auto-calculation, and cascading updates
 */

import { useCallback, useRef, useEffect } from 'react';
import { FormulaEvaluator } from '../utils/formulaEvaluator';
import type { DynamicField } from '../stores/configStore';

export interface FieldDependencyManagerProps {
  fields: DynamicField[];
  values: Record<string, unknown>;
  onFieldChange: (fieldName: string, value: unknown) => void;
}

export class FieldDependencyManager {
  private fields: DynamicField[];
  private values: Record<string, unknown>;
  private onFieldChange: (fieldName: string, value: unknown) => void;
  private evaluator: FormulaEvaluator;

  constructor(
    fields: DynamicField[],
    values: Record<string, unknown>,
    onFieldChange: (fieldName: string, value: unknown) => void
  ) {
    this.fields = fields;
    this.values = values;
    this.onFieldChange = onFieldChange;
    this.evaluator = new FormulaEvaluator(values);
  }

  /**
   * Update values and recalculate dependent fields
   */
  updateValues(values: Record<string, unknown>) {
    this.values = values;
    this.evaluator.setContext(values);
  }

  /**
   * Handle field value change and trigger cascading updates
   */
  handleFieldChange(fieldName: string, value: unknown) {
    // Update the field value
    this.values[fieldName] = value;
    this.evaluator.setContext(this.values);

    // Find fields that depend on this field
    const dependentFields = this.fields.filter(
      f => f.dependencies?.some(d => d.dependsOnField === fieldName) ||
           f.formula?.variables?.includes(fieldName) ||
           f.computed?.watchFields?.includes(fieldName)
    );

    // Recalculate each dependent field
    dependentFields.forEach(field => {
      this.recalculateField(field);
    });
  }

  /**
   * Recalculate a field's value based on its configuration
   */
  private recalculateField(field: DynamicField) {
    if (field.formula?.expression) {
      // Formula field
      const result = this.evaluator.evaluate(field.formula.expression);
      if (result !== null && result !== this.values[field.name]) {
        this.onFieldChange(field.name, result);
      }
    } else if (field.computed?.expression) {
      // Computed field
      const result = this.evaluator.evaluate(field.computed.expression);
      if (result !== null && result !== this.values[field.name]) {
        this.onFieldChange(field.name, result);
      }
    } else if (field.dependencies) {
      // Check conditional dependencies
      field.dependencies.forEach(dep => {
        const sourceValue = this.values[dep.dependsOnField];
        
        if (dep.condition) {
          const conditionMet = this.evaluateCondition(
            sourceValue,
            dep.condition.operator,
            dep.condition.value
          );
          
          if (conditionMet && dep.expression) {
            const result = this.evaluator.evaluate(dep.expression);
            if (result !== null) {
              this.onFieldChange(field.name, result);
            }
          }
        }
      });
    }
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(
    value: unknown,
    operator: string,
    compareValue: unknown
  ): boolean {
    switch (operator) {
      case 'equals':
        return value === compareValue;
      case 'notEquals':
        return value !== compareValue;
      case 'greaterThan':
        return Number(value) > Number(compareValue);
      case 'lessThan':
        return Number(value) < Number(compareValue);
      case 'contains':
        return String(value).includes(String(compareValue));
      default:
        return false;
    }
  }

  /**
   * Calculate initial values for all formula/computed fields
   */
  calculateInitialValues(): Record<string, unknown> {
    const calculatedValues: Record<string, unknown> = {};

    this.fields.forEach(field => {
      if (field.formula?.expression || field.computed?.expression) {
        const expression = field.formula?.expression || field.computed?.expression || '';
        const result = this.evaluator.evaluate(expression);
        if (result !== null) {
          calculatedValues[field.name] = result;
        }
      }
    });

    return calculatedValues;
  }

  /**
   * Get fields that should be visible based on conditional logic
   */
  getVisibleFields(): string[] {
    return this.fields
      .filter(field => {
        if (!field.conditionalLogic || field.conditionalLogic.length === 0) {
          return field.visible;
        }

        // Evaluate all conditions
        const conditionsMet = field.conditionalLogic.every(rule => {
          const fieldValue = this.values[rule.field];
          const conditionMet = this.evaluateCondition(
            fieldValue,
            rule.operator,
            rule.value
          );

          return rule.action === 'show' ? conditionMet : !conditionMet;
        });

        return conditionsMet;
      })
      .map(f => f.name);
  }

  /**
   * Get fields that should be disabled based on conditional logic
   */
  getDisabledFields(): string[] {
    return this.fields
      .filter(field => {
        if (!field.conditionalLogic) return !field.editable;

        const hasDisableRule = field.conditionalLogic.some(
          rule => rule.action === 'disable' && 
          this.evaluateCondition(
            this.values[rule.field],
            rule.operator,
            rule.value
          )
        );

        return hasDisableRule || !field.editable;
      })
      .map(f => f.name);
  }
}

/**
 * React hook for managing field dependencies
 */
export function useFieldDependencies(
  fields: DynamicField[],
  values: Record<string, unknown>,
  onChange: (name: string, value: unknown) => void
) {
  const managerRef = useRef<FieldDependencyManager | null>(null);

  if (!managerRef.current) {
    managerRef.current = new FieldDependencyManager(fields, values, onChange);
  }

  // Update manager when props change
  useEffect(() => {
    managerRef.current?.updateValues(values);
  }, [values]);

  const handleFieldChange = useCallback(
    (fieldName: string, value: unknown) => {
      managerRef.current?.handleFieldChange(fieldName, value);
      onChange(fieldName, value);
    },
    [onChange]
  );

  const getCalculatedValues = useCallback(() => {
    return managerRef.current?.calculateInitialValues() || {};
  }, []);

  const getVisibleFields = useCallback(() => {
    return managerRef.current?.getVisibleFields() || [];
  }, []);

  const getDisabledFields = useCallback(() => {
    return managerRef.current?.getDisabledFields() || [];
  }, []);

  return {
    handleFieldChange,
    getCalculatedValues,
    getVisibleFields,
    getDisabledFields
  };
}

export default FieldDependencyManager;
