import { SyntheticEvent } from 'react';

/**
 * Checks whether the string can be converted to an integer number.
 *
 * @param str string to check
 * @returns {boolean}
 */
export function isIntegerString(str: string) {
  let num = +str;
  return !isNaN(num) && num === Math.trunc(num);
}

/**
 * Prevents default action for provided event.
 *
 * @param event browser Event object
 */
export function preventDefault<T extends SyntheticEvent>(event: T) {
  event.preventDefault();
}
