import { Component } from '@angular/core';
import { RuleNodeConfiguration, RuleNodeConfigurationComponent } from '@shared/public-api';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState, isDefinedAndNotNull } from '@core/public-api';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER, SEMICOLON } from '@angular/cdk/keycodes';
import { FetchTo } from '../../rulenode-core-config.models';

@Component({
  selector: 'tb-transformation-node-copy-keys-config',
  templateUrl: './copy-keys-config.component.html',
  styleUrls: []
})

export class CopyKeysConfigComponent extends RuleNodeConfigurationComponent{
  copyKeysConfigForm: UntypedFormGroup;
  separatorKeysCodes = [ENTER, COMMA, SEMICOLON];

  constructor(protected store: Store<AppState>,
              private fb: UntypedFormBuilder) {
    super(store);
  }

  protected onConfigurationSet(configuration: RuleNodeConfiguration) {
    this.copyKeysConfigForm = this.fb.group({
      fromMetadata: [configuration ? configuration.fromMetadata : null, [Validators.required]],
      keys: [configuration ? configuration.keys : null, [Validators.required]]
    });
  }

  protected configForm(): UntypedFormGroup {
    return this.copyKeysConfigForm;
  }

  removeKey(key: string): void {
    const keys: string[] = this.copyKeysConfigForm.get('keys').value;
    const index = keys.indexOf(key);
    if (index >= 0) {
      keys.splice(index, 1);
      this.copyKeysConfigForm.get('keys').patchValue(keys, {emitEvent: true});
    }
  }

  protected prepareInputConfig(configuration: RuleNodeConfiguration): RuleNodeConfiguration {
    let fromMetadata: FetchTo;
    if (isDefinedAndNotNull(configuration?.fromMetadata)) {
      if (configuration.fromMetadata) {
        fromMetadata = FetchTo.METADATA;
      } else {
        fromMetadata = FetchTo.DATA; 
      }
    } else {
      if (configuration?.fromMetadata) {
        fromMetadata = configuration.fromMetadata;
      } else {
        fromMetadata = FetchTo.DATA;
      }
    }
    
    return {
      keys: isDefinedAndNotNull(configuration?.keys) ? configuration.keys : null,
      fromMetadata
    };
  }

  addKey(event: MatChipInputEvent): void {
    const input = event.input;
    let value = event.value;
    if ((value || '').trim()) {
      value = value.trim();
      let keys: string[] = this.copyKeysConfigForm.get('keys').value;
      if (!keys || keys.indexOf(value) === -1) {
        if (!keys) {
          keys = [];
        }
        keys.push(value);
        this.copyKeysConfigForm.get('keys').patchValue(keys, {emitEvent: true});
      }
    }
    if (input) {
      input.value = '';
    }
  }
}
