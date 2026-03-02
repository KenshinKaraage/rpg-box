import { registerPropertyField } from './index';
import { NumberField } from './NumberField';
import { BooleanField } from './BooleanField';
import { SelectField } from './SelectField';
import { ColorField } from './ColorField';
import { TextField } from './TextField';
import { TextareaField } from './TextareaField';
import { AssetImageField } from './AssetImageField';

registerPropertyField('number', NumberField);
registerPropertyField('boolean', BooleanField);
registerPropertyField('select', SelectField);
registerPropertyField('color', ColorField);
registerPropertyField('colorAlpha', ColorField);
registerPropertyField('assetImage', AssetImageField);
registerPropertyField('text', TextField);
registerPropertyField('textarea', TextareaField);
