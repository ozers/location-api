import { IsNotEmpty, IsString, MaxLength, Validate } from 'class-validator';
import { IsValidPolygon } from '../../../common/validators/polygon.validator';

export class CreateAreaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsNotEmpty()
  @Validate(IsValidPolygon)
  boundary!: object;
}
