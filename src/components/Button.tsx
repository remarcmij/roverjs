import * as React from 'react'
import {jss, colors, layout, fonts} from '../styles'
import {Tappable, SVG} from '.'
import {TappableState} from './Tappable'
import * as Color from 'color'
import {withDefaults} from '../hoc'

export interface Props {
  icon:        string | null,
  label:       string | null,
  children?:   React.ReactNode,
  classNames?: React.ClassNamesProp,
  style?:      React.CSSProperties,

  color:     Color,
  disabled?: boolean,
  small?:    boolean,
  tiny?:     boolean,

  onTap:    () => void
}
export const defaultProps = {
  icon:  null,
  label: null,
  color: colors.blue,
}

interface State {
  tappableState: TappableState
}

class Button extends React.Component<Props> {

  props: Props

  state: State = {
    tappableState: null
  }

  render() {
    const {icon, label, children, classNames, small, tiny, disabled, color, onTap} = this.props

    const {tappableState} = this.state
    const style = {
      background: select(disabled ? 'disabled' : tappableState, {
        hover:    color.lighten(0.1).string(),
        active:   color.darken(0.1).string(),
        disabled: color.string(),
        default:  color.string()
      }),
      color: colors.contrast(color).string(),
      ...this.props.style
    }

    return (
      <Tappable
        classNames={[$.button, disabled && $.buttonDisabled, small && $.buttonSmall, tiny && $.buttonTiny, classNames]}
        style={style}

        focusable={!disabled}
        onTap={disabled ? undefined : onTap}
        onStateChange={state => { this.setState({tappableState: state}) }}
      >
        <div classNames={[$.content, small && $.contentSmall, tiny && $.contentTiny]}>
          {icon && <SVG classNames={[$.icon, small && $.iconSmall, tiny && $.iconTiny]} name={icon}/>}
          <div classNames={[$.label, small && $.labelSmall, tiny && $.labelTiny]}>{label}</div>
        </div>
        {children && <div classNames={$.body}>{children}</div>}
      </Tappable>
    )
  }

}

export default withDefaults(defaultProps)(Button)

function select<O extends {}, K extends keyof O>(key: string | null, map: O): O[K] | null {
  if (key != null && key in map) {
    return map[key]
  } else if ('default' in map) {
    return (map as any).default
  } else {
    return null
  }
}

const $ = jss({
  button: {
    ...layout.flex.column,
    alignItems:     'center',
    justifyContent: 'space-around',
    padding:        layout.padding.s,

    borderRadius: layout.radius.m,
    color:        colors.fg.inverted,

    cursor: 'pointer'
  },

  content: {
    ...layout.flex.column,
    alignItems:     'center',
    justifyContent: 'space-around',
  },

  buttonDisabled: {
    opacity: 0.3,
    cursor:  'default',

    '&:focus': {
      boxShadow: 'none'
    }
  },

  icon: {
    width:  36,
    height: 36
  },

  label: {
    font:          fonts.smallCaps,
    textTransform: 'uppercase',
    fontWeight:    500
  },

  buttonSmall: {
    padding: layout.padding.xs,
  },

  iconSmall: {
    width:  24,
    height: 24
  },

  labelSmall: {
  },

  buttonTiny: {
    padding: 2,
  },

  iconTiny: {
    width:  16,
    height: 16
  },

  labelTiny: {
    font:     fonts.tiny,
    fontSize: 10
  }
})