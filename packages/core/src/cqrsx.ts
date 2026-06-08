import type { Command, ICommandHandler } from './command';
import type { Event, IEventHandler } from './event';
import type { ICqrsxContext, TConstructor } from './interface';
import type { TMiddleware, TMiddlewareFunction, TNext } from './middleware';
import type { IQueryHandler, Query } from './query';
import { isCommandClass, isEventClass, isQueryClass } from './utils';

export class Cqrsx {
  #commandHandlers = new Map<
    TConstructor<Command>,
    ICommandHandler<Command, unknown>
  >();

  #queryHandlers = new Map<
    TConstructor<Query<unknown>>,
    IQueryHandler<Query<unknown>, unknown>
  >();

  #eventHandlers = new Map<TConstructor<Event>, IEventHandler<Event>[]>();

  #middlewares: TMiddlewareFunction[] = [];

  public use(middleware: TMiddleware): this {
    if (typeof middleware === 'function') {
      this.#middlewares.push(middleware);

      return this;
    }

    this.#middlewares.push((params) => middleware.exec(params));

    return this;
  }

  public register<T extends Command>(
    messageClass: TConstructor<T>,
    handler: ICommandHandler<T, unknown>,
  ): this;
  public register<T extends Query<unknown>>(
    messageClass: TConstructor<T>,
    handler: IQueryHandler<T, unknown>,
  ): this;
  public register<T extends Event>(
    messageClass: TConstructor<T>,
    handler: IEventHandler<T>,
  ): this;
  public register(
    messageClass: TConstructor<unknown>,
    handler:
      | ICommandHandler<Command, unknown>
      | IQueryHandler<Query<unknown>, unknown>
      | IEventHandler<Event>,
  ): this {
    if (isCommandClass(messageClass)) {
      if (this.#commandHandlers.has(messageClass)) {
        console.warn(
          `Command handler for ${messageClass.name} is already registered.`,
        );

        return this;
      }

      this.#commandHandlers.set(
        messageClass,
        handler as ICommandHandler<Command, unknown>,
      );

      return this;
    }

    if (isQueryClass(messageClass)) {
      if (this.#queryHandlers.has(messageClass)) {
        console.warn(
          `Query handler for ${messageClass.name} is already registered.`,
        );

        return this;
      }

      this.#queryHandlers.set(
        messageClass,
        handler as IQueryHandler<Query<unknown>, unknown>,
      );

      return this;
    }

    if (isEventClass(messageClass)) {
      const handlers = this.#eventHandlers.get(messageClass) ?? [];

      if (handlers.includes(handler as IEventHandler<Event>)) {
        console.warn(
          `Event handler for ${messageClass.name} is already registered.`,
        );

        return this;
      }

      this.#eventHandlers.set(messageClass, [
        ...handlers,
        handler as IEventHandler<Event>,
      ]);

      return this;
    }

    throw new Error(
      'Invalid message class provided. Must extend Command, Query, or Event.',
    );
  }

  public async exec<TResult>(message: Query<TResult>): Promise<TResult>;
  public async exec(message: Command): Promise<void>;
  public async exec(message: Command | Query<unknown>): Promise<unknown> {
    const messageClass = message.constructor as TConstructor<unknown>;

    if (isCommandClass(messageClass)) {
      return this.#execWithMiddleware(
        {
          kind: 'command',
          message,
          messageClass,
        },
        async () => {
          const handler = this.#commandHandlers.get(messageClass);

          if (!handler) {
            throw new Error(
              `No handler registered for command class: "${messageClass.name}"`,
            );
          }

          return handler.exec(message);
        },
      );
    }

    if (isQueryClass(messageClass)) {
      const query = message as Query<unknown>;

      return this.#execWithMiddleware(
        {
          kind: 'query',
          message: query,
          messageClass,
        },
        async () => {
          const handler = this.#queryHandlers.get(messageClass);

          if (!handler) {
            throw new Error(
              `No handler registered for query class: "${messageClass.name}"`,
            );
          }

          return handler.exec(query);
        },
      );
    }

    throw new Error(`Unknown message structure: "${messageClass.name}"`);
  }

  public async publish(event: Event): Promise<void> {
    const eventClass = event.constructor as TConstructor<unknown>;
    const eventClassName = eventClass.name;

    if (!isEventClass(eventClass)) {
      throw new Error(`Unknown event structure: "${eventClassName}"`);
    }

    const handlers = this.#eventHandlers.get(eventClass) ?? [];

    await this.#execWithMiddleware(
      {
        kind: 'event',
        message: event,
        messageClass: eventClass,
      },
      async () => {
        for (const handler of handlers) {
          await handler.exec(event);
        }
      },
    );
  }

  async #execWithMiddleware<TResult>(
    context: ICqrsxContext,
    dispatch: TNext<TResult>,
  ): Promise<TResult> {
    let index = -1;

    const run = async (nextIndex: number): Promise<TResult> => {
      if (nextIndex <= index) {
        throw new Error('Middleware next() called multiple times.');
      }

      index = nextIndex;

      const middleware = this.#middlewares[nextIndex];

      if (!middleware) {
        return dispatch();
      }

      return middleware({
        context,
        next: () => run(nextIndex + 1),
      }) as Promise<TResult>;
    };

    return run(0);
  }
}
