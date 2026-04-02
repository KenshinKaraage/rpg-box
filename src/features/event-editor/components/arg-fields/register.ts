import { registerArgField } from './index';
import { StringArgField } from './StringArgField';
import { NumberArgField } from './NumberArgField';
import { BooleanArgField } from './BooleanArgField';
import { ColorArgField } from './ColorArgField';
import { ImageArgField } from './ImageArgField';
import { AudioArgField } from './AudioArgField';
import { DataSelectArgField } from './DataSelectArgField';

registerArgField('string', StringArgField);
registerArgField('number', NumberArgField);
registerArgField('boolean', BooleanArgField);
registerArgField('color', ColorArgField);
registerArgField('image', ImageArgField);
registerArgField('audio', AudioArgField);
registerArgField('dataSelect', DataSelectArgField);
