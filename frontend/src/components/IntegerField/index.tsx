import styles from './styles.module.scss';
import { useCallback, useState } from 'react';
import PT from 'prop-types';
import cn from 'classnames';
import debounce from 'lodash/debounce';

interface Props {
  className?: string;
  isDisabled?: boolean;
  maxValue?: number;
  minValue?: number;
  name: string;
  onChange: (v: string) => void;
  onCommit: (v: number) => void;
  value: string;
}

const rxInteger = /^\d+$/;

/**
 * Displays an integer input field with plus and minus buttons.
 *
 */
const IntegerField = ({
  className,
  isDisabled = false,
  name,
  onChange,
  onCommit,
  value,
  maxValue = Infinity,
  minValue = -Infinity,
}: Props) => {
  const [error, setError] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkValue = useCallback(
    debounce(
      (value: string) => {
        let val = +value;
        let error = '';
        if (!rxInteger.test(value) || isNaN(val)) {
          error = 'value is not a number';
        } else if (val !== Math.trunc(val)) {
          error = 'number is not an integer';
        } else if (val < minValue) {
          error = 'number is less than the minimum allowed';
        } else if (val > maxValue) {
          error = 'number is greater than the maximum allowed';
        }
        if (error) {
          setError(error);
        } else {
          onCommit(val);
        }
      },
      300,
      { leading: true }
    ),
    [maxValue, minValue, onCommit]
  );

  const onChangeValue = useCallback(
    (event) => {
      setError('');
      let val = event.target.value;
      onChange(val);
      checkValue(val);
    },
    [checkValue, onChange]
  );

  return (
    <div className={cn(styles.container, className)}>
      <input
        disabled={isDisabled}
        className={styles.input}
        name={name}
        onChange={onChangeValue}
        value={value}
      />
      <button
        className={styles.btnMinus}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (isDisabled) {
            return;
          }
          let val = +value;
          if (isNaN(val)) {
            return;
          }
          val = Math.max(Math.trunc(val) - 1, minValue);
          onChange(val + '');
          onCommit(val);
        }}
      />
      <button
        className={styles.btnPlus}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (isDisabled) {
            return;
          }
          let val = +value;
          if (isNaN(val)) {
            return;
          }
          val = Math.min(Math.trunc(val) + 1, maxValue);
          onChange(val + '');
          onCommit(val);
        }}
      />
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

IntegerField.propTypes = {
  className: PT.string,
  isDisabled: PT.bool,
  name: PT.string.isRequired,
  maxValue: PT.number,
  minValue: PT.number,
  onChange: PT.func.isRequired,
  value: PT.string.isRequired,
};

export default IntegerField;
