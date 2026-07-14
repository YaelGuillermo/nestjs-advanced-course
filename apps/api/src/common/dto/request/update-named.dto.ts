// src/common/dto/request/update-named.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateNamedDto } from './create-named.dto';

export class UpdateNamedDto extends PartialType(CreateNamedDto) {}
