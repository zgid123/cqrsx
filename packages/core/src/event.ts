export abstract class Event {
  static readonly __cqrsxKind = 'event';
}

export interface IEventHandler<T extends Event> {
  exec(event: T): Promise<void>;
}
