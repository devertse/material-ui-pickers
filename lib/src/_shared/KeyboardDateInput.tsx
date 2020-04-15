import * as React from 'react';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import { Rifm } from 'rifm';
import { useUtils } from './hooks/useUtils';
import { KeyboardIcon } from './icons/KeyboardIcon';
import { DateInputProps, DateInputRefs } from './PureDateInput';
import { createDelegatedEventHandler } from '../_helpers/utils';
import {
  maskedDateFormatter,
  getDisplayDate,
  checkMaskIsValidForCurrentFormat,
  getTextFieldAriaText,
} from '../_helpers/text-field-helper';

export const KeyboardDateInput: React.FC<DateInputProps & DateInputRefs> = ({
  disableMaskedInput,
  rawValue,
  validationError,
  KeyboardButtonProps,
  InputAdornmentProps,
  openPicker: onOpen,
  onChange,
  InputProps,
  mask,
  maskChar = '_',
  acceptRegex = /[\d]/gi,
  inputFormat,
  disabled,
  rifmFormatter,
  TextFieldComponent = TextField,
  keyboardIcon = <KeyboardIcon />,
  variant,
  emptyInputText: emptyLabel,
  disableOpenPicker: hideOpenPickerButton,
  ignoreInvalidInputs,
  onFocus,
  onBlur,
  parsedDateValue,
  forwardedRef,
  containerRef,
  open,
  readOnly,
  inputProps: inputPropsPassed,
  getOpenDialogAriaText = getTextFieldAriaText,
  ...other
}) => {
  const utils = useUtils();
  const [isFocused, setIsFocused] = React.useState(false);

  const getInputValue = () =>
    getDisplayDate(rawValue, utils, {
      inputFormat,
      emptyInputText: emptyLabel,
    });

  const formatHelperText = utils.getFormatHelperText(inputFormat);
  const [innerInputValue, setInnerInputValue] = React.useState<string | null>(getInputValue());
  const shouldUseMaskedInput = React.useMemo(() => {
    // formatting of dates is a quite slow thing, so do not make useless .format calls
    if (!mask || disableMaskedInput) {
      return false;
    }

    return checkMaskIsValidForCurrentFormat(mask, maskChar, inputFormat, acceptRegex, utils);
  }, [inputFormat, mask]); // eslint-disable-line

  const formatter = React.useMemo(
    () =>
      shouldUseMaskedInput && mask
        ? maskedDateFormatter(mask, maskChar, acceptRegex)
        : (st: string) => st,
    [shouldUseMaskedInput, mask, maskChar, acceptRegex]
  );

  React.useEffect(() => {
    // If not using mask don't update input on state change when focused to avoid such weird thing:
    // When parsing format "yyyy" with input value "2" value parsed and input value updating to "0002"
    if ((rawValue === null || utils.isValid(rawValue)) && !isFocused) {
      setInnerInputValue(getInputValue());
    }
  }, [rawValue, utils, inputFormat]); // eslint-disable-line

  const handleChange = (text: string) => {
    const finalString = text === '' || text === mask ? null : text;
    setInnerInputValue(finalString);

    const date = finalString === null ? null : utils.parse(finalString, inputFormat);
    if (ignoreInvalidInputs && !utils.isValid(date)) {
      return;
    }

    onChange(date, finalString || undefined);
  };

  const adornmentPosition = InputAdornmentProps?.position || 'end';
  const inputProps = {
    ref: containerRef,
    inputRef: forwardedRef,
    type: shouldUseMaskedInput ? 'tel' : 'text',
    disabled,
    placeholder: formatHelperText,
    variant: variant,
    error: Boolean(validationError),
    helperText: formatHelperText || validationError,
    'data-mui-test': 'keyboard-date-input',
    ...other,
    inputProps: {
      ...inputPropsPassed,
      readOnly,
    },
    onFocus: createDelegatedEventHandler(() => setIsFocused(true), onFocus),
    onBlur: createDelegatedEventHandler(() => setIsFocused(true), onBlur),
    InputProps: {
      ...InputProps,
      [`${adornmentPosition}Adornment`]: hideOpenPickerButton ? (
        undefined
      ) : (
        <InputAdornment position={adornmentPosition} {...InputAdornmentProps}>
          <IconButton
            edge={adornmentPosition}
            data-mui-test="open-picker-from-keyboard"
            disabled={disabled}
            aria-label={getOpenDialogAriaText(rawValue, utils)}
            {...KeyboardButtonProps}
            onClick={onOpen}
          >
            {keyboardIcon}
          </IconButton>
        </InputAdornment>
      ),
    },
  };

  if (!shouldUseMaskedInput) {
    return (
      <TextFieldComponent
        value={innerInputValue || ''}
        onChange={e => handleChange(e.currentTarget.value)}
        {...inputProps}
      />
    );
  }

  return (
    <Rifm
      key={mask}
      value={innerInputValue || ''}
      onChange={handleChange}
      accept={acceptRegex}
      format={rifmFormatter || formatter}
    >
      {({ onChange, value }) => (
        <TextFieldComponent
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          {...inputProps}
        />
      )}
    </Rifm>
  );
};

export default KeyboardDateInput;
