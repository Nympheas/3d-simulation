import React, { useCallback } from 'react';
import PT from 'prop-types';
import cn from 'classnames';
import styles from './styles.module.scss';

interface Props {
  className?: string;
  id?: string;
  isOn: boolean;
  name: string;
  onChange: (v: boolean) => void;
  size?: 'medium' | 'small';
}

/**
 * Displays a toggle.
 *
 * @returns {JSX.Element}
 */
const Toggle = ({
  className,
  id,
  isOn,
  name,
  onChange,
  size = 'medium',
}: Props) => {
  id = id || name;

  const onToggleChange = useCallback(
    (event) => {
      onChange(event.currentTarget.checked);
    },
    [onChange]
  );

  return (
    <label htmlFor={id} className={cn(styles.toggle, styles[size], className)}>
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={isOn}
        onChange={onToggleChange}
      />
      <span />
    </label>
  );
};

Toggle.propTypes = {
  className: PT.string,
  id: PT.string,
  isOn: PT.bool.isRequired,
  name: PT.string.isRequired,
  onChange: PT.func.isRequired,
  size: PT.oneOf(['medium', 'small']),
};

export default Toggle;
