// @flow

import * as React from 'react'
import {jss, colors, layout, fonts} from '../styles'
import {Tappable, SVG} from '.'

export interface Props {
  icon:     string,
  label:    string,
  disabled: boolean,
  onTap:    () => void,

  classNames?: React.ClassNamesProp
}

export default class ToolbarButton extends React.Component<Props> {

  props: Props

  render() {
    const {icon, label, classNames, disabled, onTap} = this.props

    return (
      <Tappable classNames={[$.button, disabled && $.buttonDisabled, classNames]} onTap={disabled ? null : onTap}>
        <SVG classNames={$.icon} name={icon}/>
        <div classNames={$.label}>{label}</div>
      </Tappable>
    )	
  }

}

const $ = jss({
  button: {
    ...layout.flex.column,
    alignItems:     'center',
    justifyContent: 'space-around',
    padding:        layout.padding.xs,
    minWidth:       56,

    border:       [1, 'solid', colors.transparent],
    borderRadius: layout.radius.m,

    cursor: 'pointer',

    '&:hover': {
      borderColor: colors.fg.inverted.alpha(0.2)
    }
  },

  buttonDisabled: {
    opacity: 0.6,
    cursor:  'default',

    '&:hover': {
      borderColor: colors.transparent
    },
    '&:focus': {
      boxShadow: 'none'
    }
  },

  icon: {
    width:  36,
    height: 36,
    fill:   colors.fg.inverted
  },

  label: {
    color:         colors.fg.inverted,
    font:          fonts.smallCaps,
    textTransform: 'small-caps',
    fontWeight:    500
  }
})