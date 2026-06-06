import { Command, type ICommandHandler } from '../command';
import type { TConstructor } from '../interface';
import { type IQueryHandler, Query } from '../query';

interface IArchiveUserCommandParams {
  readonly userId: string;
  readonly reason: string;
}

interface IFindUserNameQueryParams {
  readonly userId: string;
  readonly tenantId: string;
}

export class CreateUserCommand extends Command {
  public readonly name: string;

  public constructor(name: string) {
    super();

    this.name = name;
  }
}

export class GetUserNameQuery extends Query<string> {
  public readonly userId: string;

  public constructor(userId: string) {
    super();

    this.userId = userId;
  }
}

export class ArchiveUserCommand extends Command {
  public readonly userId: string;
  public readonly reason: string;

  public constructor({ userId, reason }: IArchiveUserCommandParams) {
    super();

    this.userId = userId;
    this.reason = reason;
  }
}

export class FindUserNameQuery extends Query<string> {
  public readonly userId: string;
  public readonly tenantId: string;

  public constructor({ userId, tenantId }: IFindUserNameQueryParams) {
    super();

    this.userId = userId;
    this.tenantId = tenantId;
  }
}

export class UnknownMessage {}

export class CreateUserCommandHandler
  implements ICommandHandler<CreateUserCommand>
{
  public executedCommand: CreateUserCommand | null = null;

  public async exec(command: CreateUserCommand): Promise<void> {
    this.executedCommand = command;
  }
}

export class GetUserNameQueryHandler
  implements IQueryHandler<GetUserNameQuery, string>
{
  readonly #resultPrefix: string;

  public constructor(resultPrefix = 'user') {
    this.#resultPrefix = resultPrefix;
  }

  public executedQuery: GetUserNameQuery | null = null;

  public async exec(query: GetUserNameQuery): Promise<string> {
    this.executedQuery = query;

    return `${this.#resultPrefix}:${query.userId}`;
  }
}

export class ArchiveUserCommandHandler
  implements ICommandHandler<ArchiveUserCommand>
{
  public executedCommand: ArchiveUserCommand | null = null;

  public async exec(command: ArchiveUserCommand): Promise<void> {
    this.executedCommand = command;
  }
}

export class FindUserNameQueryHandler
  implements IQueryHandler<FindUserNameQuery, string>
{
  public executedQuery: FindUserNameQuery | null = null;

  public async exec(query: FindUserNameQuery): Promise<string> {
    this.executedQuery = query;

    return `${query.tenantId}:${query.userId}`;
  }
}

export const invalidMessageClass =
  UnknownMessage as unknown as TConstructor<Command>;
