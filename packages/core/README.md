# @cqrsx/core

Core CQRS primitives for TypeScript applications.

`@cqrsx/core` provides a small in-memory dispatcher for commands, queries, and events. It lets you register handlers by message class, execute commands and queries, and publish events through a single `Cqrsx` object.

## Installation

```sh
pnpm add @cqrsx/core
```

## Concepts

- `Command` represents an action. Command handlers usually return `void`.
- `Query<TResult>` represents a read operation. Query handlers return `TResult`.
- `Event` represents something that already happened. Event handlers return `void`.
- `Cqrsx` registers handlers, executes commands and queries, and publishes events.

## Usage

```ts
import {
  Command,
  Cqrsx,
  Event,
  type ICommandHandler,
  type IEventHandler,
  type IQueryHandler,
  Query,
} from '@cqrsx/core';

class CreateUserCommand extends Command {
  public readonly name: string;

  public constructor(name: string) {
    super();

    this.name = name;
  }
}

class GetUserNameQuery extends Query<string> {
  public readonly userId: string;

  public constructor(userId: string) {
    super();

    this.userId = userId;
  }
}

class UserCreatedEvent extends Event {
  public readonly userId: string;

  public constructor(userId: string) {
    super();

    this.userId = userId;
  }
}

class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
  public async exec(command: CreateUserCommand): Promise<void> {
    console.log(`Creating user: ${command.name}`);
  }
}

class GetUserNameQueryHandler
  implements IQueryHandler<GetUserNameQuery, string>
{
  public async exec(query: GetUserNameQuery): Promise<string> {
    return `user:${query.userId}`;
  }
}

class UserCreatedEventHandler implements IEventHandler<UserCreatedEvent> {
  public async exec(event: UserCreatedEvent): Promise<void> {
    console.log(`User created: ${event.userId}`);
  }
}

const cqrsx = new Cqrsx()
  .register(CreateUserCommand, new CreateUserCommandHandler())
  .register(GetUserNameQuery, new GetUserNameQueryHandler())
  .register(UserCreatedEvent, new UserCreatedEventHandler());

await cqrsx.exec(new CreateUserCommand('Alpha'));

const userName = await cqrsx.exec(new GetUserNameQuery('123'));

await cqrsx.publish(new UserCreatedEvent('123'));
```

## Object Parameters

Commands, queries, and events can use object-shaped constructor parameters.

```ts
class ArchiveUserCommand extends Command {
  public readonly userId: string;
  public readonly reason: string;

  public constructor({ userId, reason }: { userId: string; reason: string }) {
    super();

    this.userId = userId;
    this.reason = reason;
  }
}

await cqrsx.exec(
  new ArchiveUserCommand({
    userId: '123',
    reason: 'inactive',
  }),
);
```

## Events

Events are published with `publish`, not `exec`.

Unlike commands and queries, events can have multiple handlers for the same event class. Handlers run sequentially in registration order. If a handler rejects, `publish` rejects and later handlers are not executed.

```ts
cqrsx
  .register(UserCreatedEvent, firstHandler)
  .register(UserCreatedEvent, secondHandler);

await cqrsx.publish(new UserCreatedEvent('123'));
```

## Duplicate Registration

Registering the same command or query class more than once does not replace the first handler.

Registering the same event handler instance more than once for the same event class does not add it twice.

When a duplicate registration happens, `Cqrsx` logs a warning and returns the same instance so chaining still works.

```ts
cqrsx
  .register(CreateUserCommand, firstHandler)
  .register(CreateUserCommand, secondHandler);

// firstHandler is still used
```

## Errors

`exec` throws when there is no registered handler for a command or query class.

`publish` resolves when there are no registered handlers for an event class.

`register` throws when the provided message class does not extend `Command`, `Query`, or `Event`.

## Development

From the repository root:

```sh
pnpm --filter @cqrsx/core build
```

Run package tests from the repository root:

```sh
vitest run packages/core/src/__tests__/cqrsx.spec.ts
```

## License

MIT
