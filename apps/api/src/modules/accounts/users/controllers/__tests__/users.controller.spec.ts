// src/modules/accounts/users/controllers/__tests__/users.controller.spec.ts
import { DeleteMode } from 'src/common/enums/delete-mode.enum';
import type { AuthenticatedUser } from 'src/common/interfaces/authenticated-user.interface';
import { HateoasService } from 'src/common/responses/hateoas.service';
import { getResponseExtras } from 'src/common/responses/response-extras.util';
import type { PaginationMeta } from 'src/common/responses/response.types';
import type { CreateUserDto } from '../../dto/request/create-user.dto';
import type { RemoveUserQueryDto } from '../../dto/request/remove-user-query.dto';
import type { UpdatePasswordDto } from '../../dto/request/update-password.dto';
import type { UpdateUserDto } from '../../dto/request/update-user.dto';
import type { UserFilterDto } from '../../dto/request/user-filter.dto';
import type { User } from '../../entities/user.entity';
import { AuthProvider } from '../../enums/auth-provider.enum';
import { UserRole } from '../../enums/user-role.enum';
import { UserPresenter } from '../../presentation/user.presenter';
import { UsersCommandService } from '../../services/users-command.service';
import { UsersQueryService } from '../../services/users-query.service';
import { UsersController } from '../users.controller';

type UsersQueryServiceMock = Pick<
  UsersQueryService,
  | 'findAllWithPagination'
  | 'findPagination'
  | 'findOne'
  | 'findOneByEmail'
  | 'findOneByUsername'
>;

type UsersCommandServiceMock = Pick<
  UsersCommandService,
  'create' | 'update' | 'remove' | 'updatePassword'
>;

type UserPresenterMock = Pick<UserPresenter, 'list' | 'detail' | 'me'>;

describe('UsersController', () => {
  let controller: UsersController;
  let usersQueryService: jest.Mocked<UsersQueryServiceMock>;
  let usersCommandService: jest.Mocked<UsersCommandServiceMock>;
  let presenter: jest.Mocked<UserPresenterMock>;

  const actor: AuthenticatedUser<UserRole> = {
    id: '5bf1fa62-da17-463e-995c-fb64e13c70b0',
    email: 'test@example.com',
    role: UserRole.USER,
  };

  const userEntity = {
    id: actor.id,
    username: 'StrongTest',
    firstName: 'Test',
    lastName: 'User',
    email: actor.email,
    role: UserRole.USER,
    provider: AuthProvider.LOCAL,
    isActive: true,
    isEmailVerified: false,
    lastLoginAt: null,
    avatar: null,
  } as User;

  const filter: UserFilterDto = {
    page: 1,
    limit: 20,
  };

  const paginationMeta: PaginationMeta = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 1,
    pageSize: 20,
    count: 1,
  };

  const pagination = {
    meta: paginationMeta,
  };

  beforeEach(() => {
    usersQueryService = {
      findAllWithPagination: jest.fn(),
      findPagination: jest.fn(),
      findOne: jest.fn(),
      findOneByEmail: jest.fn(),
      findOneByUsername: jest.fn(),
    };

    usersCommandService = {
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      updatePassword: jest.fn(),
    };

    presenter = {
      list: jest.fn(),
      detail: jest.fn(),
      me: jest.fn(),
    };

    controller = new UsersController(
      usersQueryService as unknown as UsersQueryService,
      usersCommandService as unknown as UsersCommandService,
      presenter as unknown as UserPresenter,
      new HateoasService(),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('findAll delegates filter and returns collection extras', async () => {
    const result = {
      items: [userEntity],
      totalItems: 1,
      filter,
    };

    const serializedItems = [
      {
        id: userEntity.id,
        username: userEntity.username,
        firstName: userEntity.firstName,
        lastName: userEntity.lastName,
        email: userEntity.email,
        role: userEntity.role,
      },
    ];

    usersQueryService.findAllWithPagination.mockResolvedValue({
      result,
      pagination,
    } as never);
    presenter.list.mockReturnValue(serializedItems as never);

    const response = await controller.findAll(actor, filter);

    expect(usersQueryService.findAllWithPagination).toHaveBeenCalledWith(
      filter,
    );
    expect(presenter.list).toHaveBeenCalledWith(result.items, {
      actorId: actor.id,
    });
    expect(response).toBe(serializedItems);
    expect(getResponseExtras(response)).toEqual(
      expect.objectContaining({ pagination }),
    );
  });

  it('findPagination returns wrapped pagination payload', async () => {
    usersQueryService.findPagination.mockResolvedValue(pagination as never);

    const response = await controller.findPagination(
      filter,
      '/api/v1/users/pagination?lang=es&page=1&limit=20',
    );

    expect(usersQueryService.findPagination).toHaveBeenCalledWith(filter);
    expect(response).toEqual({
      data: {
        meta: paginationMeta,
        links: {
          previous: null,
          next: null,
          first: '/api/v1/users?lang=es&page=1&limit=20',
          last: '/api/v1/users?lang=es&page=1&limit=20',
        },
      },
    });
  });

  it('findHateoas returns collection hateoas links', async () => {
    usersQueryService.findPagination.mockResolvedValue(pagination as never);

    const response = await controller.findHateoas(
      filter,
      '/api/v1/users/hateoas?lang=es&page=1&limit=20',
    );

    expect(usersQueryService.findPagination).toHaveBeenCalledWith(filter);
    expect(response.data.self).toEqual({
      href: '/api/v1/users?lang=es',
      method: 'GET',
    });
    expect(response.data.first).toEqual({
      href: '/api/v1/users?lang=es&page=1&limit=20',
      method: 'GET',
    });
  });

  it('getMe loads current user and returns presenter.me', async () => {
    const serialized = {
      id: userEntity.id,
      email: userEntity.email,
      isMe: true,
    };

    usersQueryService.findOne.mockResolvedValue(userEntity);
    presenter.me.mockReturnValue(serialized as never);

    const response = await controller.getMe(actor);

    expect(usersQueryService.findOne).toHaveBeenCalledWith(actor.id);
    expect(presenter.me).toHaveBeenCalledWith(userEntity, {
      actorId: actor.id,
    });
    expect(response).toEqual({ data: serialized });
  });

  it('findOneByEmail delegates email and returns presenter.detail', async () => {
    const serialized = { id: userEntity.id, email: userEntity.email };

    usersQueryService.findOneByEmail.mockResolvedValue(userEntity);
    presenter.detail.mockReturnValue(serialized as never);

    const response = await controller.findOneByEmail(actor, userEntity.email);

    expect(usersQueryService.findOneByEmail).toHaveBeenCalledWith(
      userEntity.email,
    );
    expect(presenter.detail).toHaveBeenCalledWith(userEntity, {
      actorId: actor.id,
    });
    expect(response).toEqual({ data: serialized });
  });

  it('findOneByUsername delegates username and returns presenter.detail', async () => {
    const serialized = { id: userEntity.id, username: userEntity.username };

    usersQueryService.findOneByUsername.mockResolvedValue(userEntity);
    presenter.detail.mockReturnValue(serialized as never);

    const response = await controller.findOneByUsername(
      actor,
      userEntity.username,
    );

    expect(usersQueryService.findOneByUsername).toHaveBeenCalledWith(
      userEntity.username,
    );
    expect(presenter.detail).toHaveBeenCalledWith(userEntity, {
      actorId: actor.id,
    });
    expect(response).toEqual({ data: serialized });
  });

  it('findOne delegates id and returns presenter.detail', async () => {
    const serialized = { id: userEntity.id };

    usersQueryService.findOne.mockResolvedValue(userEntity);
    presenter.detail.mockReturnValue(serialized as never);

    const response = await controller.findOne(actor, userEntity.id);

    expect(usersQueryService.findOne).toHaveBeenCalledWith(userEntity.id);
    expect(presenter.detail).toHaveBeenCalledWith(userEntity, {
      actorId: actor.id,
    });
    expect(response).toEqual({ data: serialized });
  });

  it('create delegates dto and returns detail with collection extras', async () => {
    const dto: CreateUserDto = {
      username: 'CreatedUser',
      firstName: 'Alice',
      lastName: 'Stone',
      email: 'alice@example.com',
      password: 'Strongp@ssword1!',
      provider: AuthProvider.LOCAL,
      role: UserRole.USER,
    };

    const created = { ...userEntity, ...dto } as User;
    const serialized = { id: created.id, email: created.email };

    usersCommandService.create.mockResolvedValue(created);
    usersQueryService.findAllWithPagination.mockResolvedValue({
      result: { items: [created], totalItems: 1, filter },
      pagination,
    } as never);
    presenter.detail.mockReturnValue(serialized as never);

    const response = await controller.create(actor, dto, filter);

    expect(usersCommandService.create).toHaveBeenCalledWith(dto);
    expect(usersQueryService.findAllWithPagination).toHaveBeenCalledWith(
      filter,
    );
    expect(presenter.detail).toHaveBeenCalledWith(created, {
      actorId: actor.id,
    });
    expect(response).toBe(serialized);
    expect(getResponseExtras(response)).toEqual(
      expect.objectContaining({ pagination }),
    );
  });

  it('update delegates id and dto and returns presenter.detail', async () => {
    const dto: UpdateUserDto = { firstName: 'Updated' };
    const updated = { ...userEntity, ...dto } as User;
    const serialized = { id: updated.id, firstName: updated.firstName };

    usersCommandService.update.mockResolvedValue(updated);
    presenter.detail.mockReturnValue(serialized as never);

    const response = await controller.update(actor, userEntity.id, dto);

    expect(usersCommandService.update).toHaveBeenCalledWith(userEntity.id, dto);
    expect(presenter.detail).toHaveBeenCalledWith(updated, {
      actorId: actor.id,
    });
    expect(response).toEqual({ data: serialized });
  });

  it('remove delegates id and mode and returns detail with collection extras', async () => {
    const query: RemoveUserQueryDto = {
      ...filter,
      mode: DeleteMode.HARD,
    };
    const serialized = { id: userEntity.id, deletedAt: null };

    usersCommandService.remove.mockResolvedValue(userEntity);
    usersQueryService.findAllWithPagination.mockResolvedValue({
      result: { items: [], totalItems: 0, filter },
      pagination,
    } as never);
    presenter.detail.mockReturnValue(serialized as never);

    const response = await controller.remove(actor, userEntity.id, query);

    expect(usersCommandService.remove).toHaveBeenCalledWith(
      userEntity.id,
      DeleteMode.HARD,
    );
    expect(usersQueryService.findAllWithPagination).toHaveBeenCalledWith(
      filter,
    );
    expect(presenter.detail).toHaveBeenCalledWith(userEntity, {
      actorId: actor.id,
    });
    expect(response).toBe(serialized);
    expect(getResponseExtras(response)).toEqual(
      expect.objectContaining({ pagination }),
    );
  });

  it('updatePassword delegates id and dto', async () => {
    const dto: UpdatePasswordDto = {
      oldPassword: 'Strongp@ssword1!',
      newPassword: 'NewStrongp@ssword2!',
      confirmPassword: 'NewStrongp@ssword2!',
    };

    await controller.updatePassword(userEntity.id, dto);

    expect(usersCommandService.updatePassword).toHaveBeenCalledWith(
      userEntity.id,
      dto,
    );
  });
});
