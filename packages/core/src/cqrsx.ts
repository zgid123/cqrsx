import type { Command, ICommandHandler } from './command';
import type { TConstructor } from './interface';
import type { IQueryHandler, Query } from './query';
import { isCommandClass, isQueryClass } from './utils';

export class Cqrsx {
  #commandHandlers = new Map<
    TConstructor<Command>,
    ICommandHandler<Command, unknown>
  >();

  #queryHandlers = new Map<
    TConstructor<Query<unknown>>,
    IQueryHandler<Query<unknown>, unknown>
  >();

  public register<T extends Command>(
    messageClass: TConstructor<T>,
    handler: ICommandHandler<T, unknown>,
  ): this;
  public register<T extends Query<unknown>>(
    messageClass: TConstructor<T>,
    handler: IQueryHandler<T, unknown>,
  ): this;
  public register(
    messageClass: TConstructor<unknown>,
    handler:
      | ICommandHandler<Command, unknown>
      | IQueryHandler<Query<unknown>, unknown>,
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

    throw new Error(
      `Invalid message class provided. Must extend Command or Query.`,
    );
  }

  public async exec<TResult>(message: Query<TResult>): Promise<TResult>;
  public async exec(message: Command): Promise<void>;
  public async exec(message: Command | Query<unknown>): Promise<unknown> {
    const messageClass = message.constructor as TConstructor<unknown>;

    if (isCommandClass(messageClass)) {
      const handler = this.#commandHandlers.get(messageClass);

      if (!handler) {
        throw new Error(
          `No handler registered for command class: "${messageClass.name}"`,
        );
      }

      return handler.exec(message);
    }

    if (isQueryClass(messageClass)) {
      const handler = this.#queryHandlers.get(messageClass);

      if (!handler) {
        throw new Error(
          `No handler registered for query class: "${messageClass.name}"`,
        );
      }

      return handler.exec(message as Query<unknown>);
    }

    throw new Error(`Unknown message structure: "${messageClass.name}"`);
  }
}
