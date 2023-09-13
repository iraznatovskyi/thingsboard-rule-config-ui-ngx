import { Component, forwardRef, Injector, Input, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  NgControl,
  ValidationErrors,
  Validator,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { coerceBoolean } from '@shared/public-api';
import { isEqual } from '@core/public-api';
import { Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  selector: 'tb-kv-map-config',
  templateUrl: './kv-map-config.component.html',
  styleUrls: ['./kv-map-config.component.scss', '../../../../style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KvMapConfigComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => KvMapConfigComponent),
      multi: true,
    }
  ]
})
export class KvMapConfigComponent implements ControlValueAccessor, OnInit, Validator, OnDestroy {

  private propagateChange = null;
  private valueChangeSubscription: Subscription = null;
  private destroy$ = new Subject<void>();

  kvListFormGroup: FormGroup;
  ngControl: NgControl;

  @Input()
  @coerceBoolean()
  disabled = false;

  @Input()
  @coerceBoolean()
  uniqueKeyValuePairValidator = false;

  @Input() labelText: string;

  @Input() requiredText: string;

  @Input() keyText: string;

  @Input() keyRequiredText: string;

  @Input() valText: string;

  @Input() valRequiredText: string;

  @Input() hintText: string;

  @Input() popupHelpLink: string;

  @Input()
  @coerceBoolean()
  required = false;

  constructor(private injector: Injector,
              private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.ngControl = this.injector.get(NgControl);
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
    this.kvListFormGroup = this.fb.group({
      keyVals: this.fb.array([])
    }, {validators: this.propagateNestedErrors});

    this.valueChangeSubscription = this.kvListFormGroup.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateModel();
      });
  }

  keyValsFormArray(): FormArray {
    return this.kvListFormGroup.get('keyVals') as FormArray;
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.disabled) {
      this.kvListFormGroup.disable({emitEvent: false});
    } else {
      this.kvListFormGroup.enable({emitEvent: false});
    }
  }

  duplicateValuesValidator: ValidatorFn = (control: FormGroup): ValidationErrors | null =>
    control.controls.key.value === control.controls.value.value && this.uniqueKeyValuePairValidator
      ? { uniqueKeyValuePair: true }
      : null;

  propagateNestedErrors: ValidatorFn = (controls: FormArray | FormGroup | AbstractControl): ValidationErrors | null => {
    if (this.kvListFormGroup && this.kvListFormGroup.get('keyVals') && this.kvListFormGroup.get('keyVals')?.status === 'VALID') {
      return null;
    }
    const errors = {};
    if (this.kvListFormGroup) {this.kvListFormGroup.setErrors(null);}
    if (controls instanceof FormArray || controls instanceof FormGroup) {
      if (controls.errors) {
        for (const errorKey of Object.keys(controls.errors)) {
          errors[errorKey] = true;
        }
      }
      for (const control of Object.keys(controls.controls)) {
        const innerErrors = this.propagateNestedErrors(controls.controls[control]);
        if (innerErrors && Object.keys(innerErrors).length) {
          for (const errorKey of Object.keys(innerErrors)) {
            errors[errorKey] = true;
          }
        }
      }
      return errors;
    } else {
      if (controls.errors) {
        for (const errorKey of Object.keys(controls.errors)) {
          errors[errorKey] = true;
        }
      }
    }

    return !isEqual(errors, {}) ? errors : null;
  };


  writeValue(keyValMap: { [key: string]: string }): void {
    const keyValsControls: Array<AbstractControl> = [];
    if (keyValMap) {
      for (const property of Object.keys(keyValMap)) {
        if (Object.prototype.hasOwnProperty.call(keyValMap, property)) {
          keyValsControls.push(this.fb.group({
            key: [property, [Validators.required, Validators.pattern(/(?:.|\s)*\S(&:.|\s)*/)]],
            value: [keyValMap[property], [Validators.required, Validators.pattern(/(?:.|\s)*\S(&:.|\s)*/)]]
          }, {validators: this.duplicateValuesValidator}));
        }
      }
    }
    this.kvListFormGroup.setControl('keyVals', this.fb.array(keyValsControls, this.propagateNestedErrors), {emitEvent: false});
  }

  public removeKeyVal(index: number) {
    (this.kvListFormGroup.get('keyVals') as FormArray).removeAt(index);
  }

  public addKeyVal() {
    const keyValsFormArray = this.kvListFormGroup.get('keyVals') as FormArray;
    keyValsFormArray.push(this.fb.group({
      key: ['', [Validators.required, Validators.pattern(/(?:.|\s)*\S(&:.|\s)*/)]],
      value: ['', [Validators.required, Validators.pattern(/(?:.|\s)*\S(&:.|\s)*/)]]
    }, {validators: this.duplicateValuesValidator}));
  }

  public validate(c: FormControl) {
    const kvList: { key: string; value: string }[] = this.kvListFormGroup.get('keyVals').value;
    if (!kvList.length && this.required) {
      return {
        kvMapRequired: true
      };
    }
    if (!this.kvListFormGroup.valid) {
      return {
        kvFieldsRequired: true
      };
    }
    if (this.uniqueKeyValuePairValidator) {
      for (const kv of kvList) {
        if (kv.key === kv.value) {
          return {
            uniqueKeyValuePair: true
          };
        }
      }
    }
    return null;
  }

  private updateModel() {
    const kvList: { key: string; value: string }[] = this.kvListFormGroup.get('keyVals').value;
    if (this.required && !kvList.length || !this.kvListFormGroup.valid) {
      this.propagateChange(null);
    } else {
      const keyValMap: { [key: string]: string } = {};
      kvList.forEach((entry) => {
        keyValMap[entry.key] = entry.value;
      });
      this.propagateChange(keyValMap);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
