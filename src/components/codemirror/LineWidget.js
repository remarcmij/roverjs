// @flow

import * as React from 'react'
import {unstable_renderSubtreeIntoContainer as renderSubtreeIntoContainer, unmountComponentAtNode} from 'react-dom'
import CodeMirror from 'codemirror'
import PropTypes from 'prop-types'
import {Tappable} from '..'
import isEqual from 'lodash/isEqual'

export interface Props {
  line:     number,
  onTap:    ?(() => void),
  options?: Object,

  classNames?: React.ClassNamesProp,
  children?:  any
}

export default class LineWidget extends React.Component<Props> {

  props: Props

  element: ?HTMLElement = null
  widget:  ?CodeMirror.LineWidget = null

  static contextTypes = {
    codeMirror: PropTypes.instanceOf(CodeMirror)
  }

  //------
  // Element

  create(props: Props = this.props) {
    const {codeMirror} = this.context
    const {line, options} = props

    this.element = document.createElement('div')
    this.lineWidget = codeMirror.addLineWidget(line, this.element, options)

    this.rerender(props)
  }

  destroy() {
    const {element, lineWidget} = this
    if (element == null || lineWidget == null) { return }

    lineWidget.clear()
    unmountComponentAtNode(this.element)
  }

  //------
  // Component lifecycle

  componentDidMount() {
    this.create()
  }

  componentWillUnmount() {
    this.destroy()
  }

  componentWillReceiveProps(props: Props) {
    if (props.line !== this.props.line) {
      this.destroy()
      this.create(props)
    } else {
      this.rerender(props)
    }
  }

  shouldComponentUpdate(props: Props) {
    if (props.line !== this.props.line) { return true }
    if (props.onTap !== this.props.onTap) { return true }
    if (props.children !== this.props.children) { return true }
    if (classNames(props.classNames) !== classNames(this.props.classNames)) { return true }
    if (!isEqual(props.options, this.props.options)) { return true }

    return false
  }

  rerender(props: Props) {
    const {element, lineWidget} = this
    if (element == null || lineWidget == null) { return }

    renderSubtreeIntoContainer(this, this.renderWidget(props), element)
    try {
      lineWidget.changed()
    } catch (_) {
      // If the line does not exist anymore, an error is thrown. This is ok as the line widget is
      // destroyed soon anyway.
    }
  }

  //------
  // Rendering

  render() {
    return null
  }

  renderWidget(props: Props) {
    const {classNames, onTap, children} = props
    const Component = onTap != null ? Tappable : 'div'
    const tapProps = onTap != null ? {onTap} : {}

    return (
      <Component classNames={classNames} {...tapProps}>
        {children}
      </Component>
    )
  }

}