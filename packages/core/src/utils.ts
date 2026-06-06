import type { Command } from './command';
import type { Event } from './event';
import type { TConstructor } from './interface';
import type { Query } from './query';

function drillKind(messageClass: TConstructor<unknown>): string {
  return '__cqrsxKind' in messageClass
    ? (messageClass.__cqrsxKind as string)
    : '';
}

export function isCommandClass(
  messageClass: TConstructor<unknown>,
): messageClass is TConstructor<Command> {
  return drillKind(messageClass) === 'command';
}

export function isQueryClass(
  messageClass: TConstructor<unknown>,
): messageClass is TConstructor<Query<unknown>> {
  return drillKind(messageClass) === 'query';
}

export function isEventClass(
  messageClass: TConstructor<unknown>,
): messageClass is TConstructor<Event> {
  return drillKind(messageClass) === 'event';
}
