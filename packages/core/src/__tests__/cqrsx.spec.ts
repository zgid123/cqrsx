import type { Command } from '../command';
import { Cqrsx } from '../cqrsx';
import {
  ArchiveUserCommand,
  ArchiveUserCommandHandler,
  CreateUserCommand,
  CreateUserCommandHandler,
  FailingUserCreatedEventHandler,
  FindUserNameQuery,
  FindUserNameQueryHandler,
  GetUserNameQuery,
  GetUserNameQueryHandler,
  invalidMessageClass,
  RecordingUserCreatedEventHandler,
  UnknownMessage,
  UserCreatedEvent,
  UserCreatedEventHandler,
} from './fixtures';

describe('#Cqrsx', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('.register', () => {
    suite('when chaining command and query handler registrations', () => {
      it('returns the current instance and registers every command and query handler', async () => {
        const cqrsx = new Cqrsx();
        const commandHandler = new CreateUserCommandHandler();
        const queryHandler = new GetUserNameQueryHandler();
        const command = new CreateUserCommand('Alpha');
        const query = new GetUserNameQuery('123');

        const result = cqrsx
          .register(CreateUserCommand, commandHandler)
          .register(GetUserNameQuery, queryHandler);

        await cqrsx.exec(command);
        const queryResult = await cqrsx.exec(query);

        expect(result).toBe(cqrsx);
        expect(queryResult).toBe('user:123');
        expect(commandHandler.executedCommand).toBe(command);
        expect(queryHandler.executedQuery).toBe(query);
      });
    });

    suite('when registering an event handler', () => {
      it('returns the current instance and registers the event handler', async () => {
        const cqrsx = new Cqrsx();
        const handler = new UserCreatedEventHandler();
        const event = new UserCreatedEvent('123');

        const result = cqrsx.register(UserCreatedEvent, handler);

        await cqrsx.publish(event);

        expect(result).toBe(cqrsx);
        expect(handler.executedEvent).toBe(event);
      });
    });

    suite('when registering a command handler twice', () => {
      it('logs warning and keeps the first command handler', async () => {
        const cqrsx = new Cqrsx();
        const command = new CreateUserCommand('Alpha');
        const firstHandler = new CreateUserCommandHandler();
        const secondHandler = new CreateUserCommandHandler();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        cqrsx.register(CreateUserCommand, firstHandler);
        cqrsx.register(CreateUserCommand, secondHandler);

        await cqrsx.exec(command);

        expect(warn).toHaveBeenCalledWith(
          'Command handler for CreateUserCommand is already registered.',
        );
        expect(firstHandler.executedCommand).toBe(command);
        expect(secondHandler.executedCommand).toBeNull();
      });
    });

    suite('when registering a query handler twice', () => {
      it('logs warning and keeps the first query handler', async () => {
        const cqrsx = new Cqrsx();
        const query = new GetUserNameQuery('123');
        const firstHandler = new GetUserNameQueryHandler('first');
        const secondHandler = new GetUserNameQueryHandler('second');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        cqrsx.register(GetUserNameQuery, firstHandler);
        cqrsx.register(GetUserNameQuery, secondHandler);

        const result = await cqrsx.exec(query);

        expect(warn).toHaveBeenCalledWith(
          'Query handler for GetUserNameQuery is already registered.',
        );
        expect(result).toBe('first:123');
        expect(firstHandler.executedQuery).toBe(query);
        expect(secondHandler.executedQuery).toBeNull();
      });
    });

    suite('when registering the same event handler twice', () => {
      it('logs warning and keeps only the first event handler registration', async () => {
        const cqrsx = new Cqrsx();
        const records: string[] = [];
        const event = new UserCreatedEvent('123');
        const handler = new RecordingUserCreatedEventHandler('first', records);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        cqrsx.register(UserCreatedEvent, handler);
        cqrsx.register(UserCreatedEvent, handler);

        await cqrsx.publish(event);

        expect(warn).toHaveBeenCalledWith(
          'Event handler for UserCreatedEvent is already registered.',
        );
        expect(records).toEqual(['first:123']);
      });
    });

    suite('when registering an invalid message class', () => {
      it('throws invalid message class error', () => {
        const cqrsx = new Cqrsx();
        const handler = new CreateUserCommandHandler();

        expect(() => cqrsx.register(invalidMessageClass, handler)).toThrow(
          'Invalid message class provided. Must extend Command, Query, or Event.',
        );
      });
    });
  });

  describe('.exec', () => {
    suite('when executing a registered command', () => {
      it('executes the command handler', async () => {
        const cqrsx = new Cqrsx();
        const handler = new CreateUserCommandHandler();
        const command = new CreateUserCommand('Alpha');

        cqrsx.register(CreateUserCommand, handler);

        const result = await cqrsx.exec(command);

        expect(result).toBeUndefined();
        expect(handler.executedCommand).toBe(command);
      });
    });

    suite('when executing a registered command with object params', () => {
      it('executes the command handler', async () => {
        const cqrsx = new Cqrsx();
        const handler = new ArchiveUserCommandHandler();
        const command = new ArchiveUserCommand({
          userId: '123',
          reason: 'inactive',
        });

        cqrsx.register(ArchiveUserCommand, handler);

        const result = await cqrsx.exec(command);

        expect(result).toBeUndefined();
        expect(handler.executedCommand).toBe(command);
      });
    });

    suite('when executing a registered query', () => {
      it('executes the query handler and returns its result', async () => {
        const cqrsx = new Cqrsx();
        const handler = new GetUserNameQueryHandler();
        const query = new GetUserNameQuery('123');

        cqrsx.register(GetUserNameQuery, handler);

        const result = await cqrsx.exec(query);

        expect(result).toBe('user:123');
        expect(handler.executedQuery).toBe(query);
      });
    });

    suite('when executing a registered query with object params', () => {
      it('executes the query handler and returns its result', async () => {
        const cqrsx = new Cqrsx();
        const handler = new FindUserNameQueryHandler();
        const query = new FindUserNameQuery({
          userId: '123',
          tenantId: 'acme',
        });

        cqrsx.register(FindUserNameQuery, handler);

        const result = await cqrsx.exec(query);

        expect(result).toBe('acme:123');
        expect(handler.executedQuery).toBe(query);
      });
    });

    suite('when executing a command without a registered handler', () => {
      it('throws missing command handler error', async () => {
        const cqrsx = new Cqrsx();

        await expect(
          cqrsx.exec(new CreateUserCommand('Alpha')),
        ).rejects.toThrow(
          'No handler registered for command class: "CreateUserCommand"',
        );
      });
    });

    suite('when executing a query without a registered handler', () => {
      it('throws missing query handler error', async () => {
        const cqrsx = new Cqrsx();

        await expect(cqrsx.exec(new GetUserNameQuery('123'))).rejects.toThrow(
          'No handler registered for query class: "GetUserNameQuery"',
        );
      });
    });

    suite('when executing an unknown message structure', () => {
      it('throws unknown message structure error', async () => {
        const cqrsx = new Cqrsx();

        await expect(
          cqrsx.exec(new UnknownMessage() as Command),
        ).rejects.toThrow('Unknown message structure: "UnknownMessage"');
      });
    });
  });

  describe('.publish', () => {
    suite('when publishing an event with multiple handlers', () => {
      it('executes every event handler in registration order', async () => {
        const cqrsx = new Cqrsx();
        const records: string[] = [];
        const event = new UserCreatedEvent('123');

        cqrsx
          .register(
            UserCreatedEvent,
            new RecordingUserCreatedEventHandler('first', records),
          )
          .register(
            UserCreatedEvent,
            new RecordingUserCreatedEventHandler('second', records),
          );

        await cqrsx.publish(event);

        expect(records).toEqual(['first:123', 'second:123']);
      });
    });

    suite('when publishing an event without registered handlers', () => {
      it('resolves without error', async () => {
        const cqrsx = new Cqrsx();

        await expect(
          cqrsx.publish(new UserCreatedEvent('123')),
        ).resolves.toBeUndefined();
      });
    });

    suite('when an event handler throws', () => {
      it('rejects without executing later event handlers', async () => {
        const cqrsx = new Cqrsx();
        const records: string[] = [];

        cqrsx
          .register(
            UserCreatedEvent,
            new RecordingUserCreatedEventHandler('first', records),
          )
          .register(UserCreatedEvent, new FailingUserCreatedEventHandler())
          .register(
            UserCreatedEvent,
            new RecordingUserCreatedEventHandler('third', records),
          );

        await expect(
          cqrsx.publish(new UserCreatedEvent('123')),
        ).rejects.toThrow('Failed to handle user created event.');
        expect(records).toEqual(['first:123']);
      });
    });
  });
});
