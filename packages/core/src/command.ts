export abstract class Command {
  static readonly __cqrsxKind = 'command';
}

export interface ICommandHandler<T extends Command, TResult = void> {
  exec(command: T): Promise<TResult>;
}
