// src/modules/accounts/users/controllers/users.controller.ts
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
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { RequestPath } from 'src/common/decorators/request-path.decorator';
import { SetResponseEnvelopeOptions } from 'src/common/decorators/response-envelope-options.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { DeleteMode } from 'src/common/enums/delete-mode.enum';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { ParseUUIDPipe } from 'src/common/pipes/parse-uuid.pipe';
import {
  attachCollection,
  buildCollectionHateoasFromPagination,
  buildCollectionPagination,
} from 'src/common/responses/collection-response.util';
import { HateoasService } from 'src/common/responses/hateoas.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { USER_SUCCESS } from '../constants/user.constants';
import { CreateUserDto } from '../dto/request/create-user.dto';
import { RemoveUserQueryDto } from '../dto/request/remove-user-query.dto';
import { UpdatePasswordDto } from '../dto/request/update-password.dto';
import { UpdateUserDto } from '../dto/request/update-user.dto';
import { UserFilterDto } from '../dto/request/user-filter.dto';
import type { UserRole } from '../enums/user-role.enum';
import { UserPresenter } from '../presentation/user.presenter';
import { UsersCommandService } from '../services/users-command.service';
import { UsersQueryService } from '../services/users-query.service';

@Controller('accounts/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersQueryService: UsersQueryService,
    private readonly usersCommandService: UsersCommandService,
    private readonly userPresenter: UserPresenter,
    private readonly hateoasService: HateoasService,
  ) {}

  @Get()
  @ResponseMessage(USER_SUCCESS.LIST)
  async findAll(
    @CurrentUser() actor: AuthenticatedUser<UserRole>,
    @Query() filter: UserFilterDto,
  ) {
    const { result, pagination } =
      await this.usersQueryService.findAllWithPagination(filter);

    const data = this.userPresenter.list(result.items, {
      actorId: actor.id,
    });

    return attachCollection(data, { pagination });
  }

  @Get('pagination')
  @SetResponseEnvelopeOptions({ includeRequestLimits: false })
  @ResponseMessage(USER_SUCCESS.PAGINATION)
  async findPagination(
    @Query() filter: UserFilterDto,
    @RequestPath() requestPath: string,
  ) {
    const pagination = await this.usersQueryService.findPagination(filter);
    const data = buildCollectionPagination(requestPath, pagination);

    return { data };
  }

  @Get('hateoas')
  @SetResponseEnvelopeOptions({ includeRequestLimits: false })
  @ResponseMessage(USER_SUCCESS.HATEOAS)
  async findHateoas(
    @Query() filter: UserFilterDto,
    @RequestPath() requestPath: string,
  ) {
    const pagination = await this.usersQueryService.findPagination(filter);
    const data = buildCollectionHateoasFromPagination(
      requestPath,
      this.hateoasService,
      pagination,
    );

    return { data };
  }

  @Get('me')
  @ResponseMessage(USER_SUCCESS.FETCHED)
  async getMe(@CurrentUser() actor: AuthenticatedUser<UserRole>) {
    const user = await this.usersQueryService.findOne(actor.id);
    const data = this.userPresenter.me(user, { actorId: actor.id });

    return { data };
  }

  @Get('email/:email')
  @ResponseMessage(USER_SUCCESS.FETCHED)
  async findOneByEmail(
    @CurrentUser() actor: AuthenticatedUser<UserRole>,
    @Param('email') email: string,
  ) {
    const user = await this.usersQueryService.findOneByEmail(email);
    const data = this.userPresenter.detail(user, { actorId: actor.id });

    return { data };
  }

  @Get('username/:username')
  @ResponseMessage(USER_SUCCESS.FETCHED)
  async findOneByUsername(
    @CurrentUser() actor: AuthenticatedUser<UserRole>,
    @Param('username') username: string,
  ) {
    const user = await this.usersQueryService.findOneByUsername(username);
    const data = this.userPresenter.detail(user, { actorId: actor.id });

    return { data };
  }

  @Get(':id')
  @ResponseMessage(USER_SUCCESS.FETCHED)
  async findOne(
    @CurrentUser() actor: AuthenticatedUser<UserRole>,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const user = await this.usersQueryService.findOne(id);
    const data = this.userPresenter.detail(user, { actorId: actor.id });

    return { data };
  }

  @Post()
  @ResponseMessage(USER_SUCCESS.CREATED)
  async create(
    @CurrentUser() actor: AuthenticatedUser<UserRole>,
    @Body() dto: CreateUserDto,
    @Query() filter: UserFilterDto,
  ) {
    const created = await this.usersCommandService.create(dto);
    const { pagination } =
      await this.usersQueryService.findAllWithPagination(filter);
    const data = this.userPresenter.detail(created, { actorId: actor.id });

    return attachCollection(data, { pagination });
  }

  @Patch(':id')
  @ResponseMessage(USER_SUCCESS.UPDATED)
  async update(
    @CurrentUser() actor: AuthenticatedUser<UserRole>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const updated = await this.usersCommandService.update(id, dto);
    const data = this.userPresenter.detail(updated, { actorId: actor.id });

    return { data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(USER_SUCCESS.DELETED)
  async remove(
    @CurrentUser() actor: AuthenticatedUser<UserRole>,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: RemoveUserQueryDto,
  ) {
    const { mode = DeleteMode.SOFT, ...filter } = query;
    const removed = await this.usersCommandService.remove(id, mode);
    const { pagination } =
      await this.usersQueryService.findAllWithPagination(filter);
    const data = this.userPresenter.detail(removed, { actorId: actor.id });

    return attachCollection(data, { pagination });
  }

  @Patch(':id/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage(USER_SUCCESS.PASSWORD_UPDATED)
  async updatePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePasswordDto,
  ): Promise<void> {
    await this.usersCommandService.updatePassword(id, dto);
  }
}
