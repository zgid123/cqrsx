import type { Command } from './command';
import type { Event } from './event';
import type { Query } from './query';

export type TConstructor<T> = abstract new (...args: never[]) => T;

export type TMessage = Command | Query<unknown> | Event;

export type TMessageKind = 'command' | 'query' | 'event';

export interface ICqrsxContext<TCurrentMessage extends TMessage = TMessage> {
  readonly kind: TMessageKind;
  readonly message: TCurrentMessage;
  readonly messageClass: TConstructor<TCurrentMessage>;
}
