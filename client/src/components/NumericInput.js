import React, { useState } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import isUndefined from 'lodash/isUndefined';
import isNaN from 'lodash/isNaN';


const StyledInput = styled.input.attrs({ type: 'text' })`
  font-size: 16px;
  width: ${({ inputWidth }) => inputWidth || 100}px;
  &:focus { outline: none; }
  background: none;
  border: none;
  border-bottom: 2px solid #3D0158;
  ${({ textRight }) => textRight && 'text-align: right;'}
`;

const InputRow = styled.div`
  display: flex;
  ${({ textRight }) => textRight && 'justify-content: flex-end'}
`;

const Ticker = styled.strong`
  margin-left: 5px;
  color: #3D0158;
`;

const parseValue = (event, onChange, setCurrentValue, noDecimals) => {
  const { value: rawValue } = event.target;
  let value = rawValue
    .replace(/[^0-9.,]+/g, '')
    .replace(/[,]+/g, '.');
  if (noDecimals) {
    value = value.replace(/[.]+/g, '');
  } else if (value.indexOf('.') !== value.lastIndexOf('.')) {
    const [first, ...rest] = value.split('.');
    value = `${first}.${rest.join('')}`;
  }
  if (!value) value = '';
  setCurrentValue(value);
  onChange(value);
};

const NumericInput = ({
  paddingLeft,
  paddingRight,
  textRight,
  placeholder,
  ticker,
  inputWidth,
  noPlaceholder,
  onChange,
  disabled,
  noDecimals,
  defaultValue,
}) => {
  const [currentValue, setCurrentValue] = useState('');
  const valueParser = (event) => parseValue(event, onChange, setCurrentValue, noDecimals);
  return (
    <InputRow textRight={textRight}>
      <StyledInput
        placeholder={!noPlaceholder && (placeholder || 'Enter value')}
        paddingLeft={paddingLeft}
        paddingRight={paddingRight}
        textRight={textRight}
        inputWidth={inputWidth}
        value={currentValue || defaultValue}
        onChange={valueParser}
        onBlur={valueParser}
        disabled={disabled}
      />
      {ticker && <Ticker>{ticker}</Ticker>}
    </InputRow>
  );
};

NumericInput.propTypes = {
  paddingLeft: PropTypes.number,
  paddingRight: PropTypes.number,
  textRight: PropTypes.bool,
  placeholder: PropTypes.string,
  ticker: PropTypes.string,
  inputWidth: PropTypes.number,
  noPlaceholder: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  noDecimals: PropTypes.bool,
  defaultValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default NumericInput;
