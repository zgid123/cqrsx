import type { Command } from '../command';
import { Cqrsx } from '../cqrsx';
import {
  ArchiveUserCommand,
  ArchiveUserCommandHandler,
  CreateUserCommand,
  CreateUserCommandHandler,
  FindUserNameQuery,
  FindUserNameQueryHandler,
  GetUserNameQuery,
  GetUserNameQueryHandler,
  invalidMessageClass,
  UnknownMessage,
} from './fixtures';

describe('#Cqrsx', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('.register', () => {
    suite('when chaining command and query handler registrations', () => {
      it('returns the current instance and registers every handler', async () => {
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

    suite('when registering an invalid message class', () => {
      it('throws invalid message class error', () => {
        const cqrsx = new Cqrsx();
        const handler = new CreateUserCommandHandler();

        expect(() => cqrsx.register(invalidMessageClass, handler)).toThrow(
          'Invalid message class provided. Must extend Command or Query.',
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
});
