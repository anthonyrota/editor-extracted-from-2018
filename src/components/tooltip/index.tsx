import { isFunction } from 'lodash-es'
import * as React from 'react'
import classes from './style.module.scss'

export interface TooltipRenderProps {
  focused: boolean
}

export interface TooltipProps {
  info: string
  children: JSX.Element | ((props: TooltipRenderProps) => JSX.Element)
  holdDuration?: number
}

export interface TooltipState {
  visible: boolean
  focused: boolean
}

export class Tooltip extends React.Component<TooltipProps, TooltipState> {
  private timeout?: number
  private skipMouseEnterEvent?: boolean

  public static defaultProps = {
    holdDuration: 200
  }

  public state = {
    visible: false,
    focused: false
  }

  public queueShow = () => {
    this.setState({ focused: true })
    this.timeout = window.setTimeout(
      () => this.setState({ visible: true }),
      this.props.holdDuration
    )
  }

  public hide = () => {
    window.clearTimeout(this.timeout)
    document.removeEventListener('touchstart', this.hide)
    this.setState({ visible: false, focused: false })
  }

  public onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    this.queueShow()
    e.stopPropagation()
    this.skipMouseEnterEvent = true
    document.addEventListener('touchstart', this.hide)
  }

  public onMouseEnter = () => {
    if (this.skipMouseEnterEvent) {
      this.skipMouseEnterEvent = false
    } else {
      this.queueShow()
    }
  }

  public render() {
    const { info, children } = this.props
    const { visible, focused } = this.state

    return (
      <div
        className={classes.wrapper}
        onTouchEnd={this.hide}
        onTouchStart={this.onTouchStart}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.hide}
      >
        {isFunction(children) ? children({ focused }) : children}
        {visible && (
          <div className={classes.tooltip}>
            <div className={classes.content} data-text={info} />
            <div className={classes.arrow} />
            <div className={classes.gap} />
          </div>
        )}
      </div>
    )
  }
}
