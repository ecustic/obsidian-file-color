import React from 'react'
import { HTMLProps } from 'react'

export const SettingItem = ({
  className,
  ...props
}: HTMLProps<HTMLDivElement>) => (
  <div className={`setting-item${className ? ' ' + className : ''}`} {...props} />
)
export const SettingItemName = ({
  className,
  ...props
}: HTMLProps<HTMLDivElement>) => (
  <div className={`setting-item-name${className ? ' ' + className : ''}`} {...props} />
)
export const SettingItemControl = ({
  className,
  ...props
}: HTMLProps<HTMLDivElement>) => (
  <div className={`setting-item-control${className ? ' ' + className : ''}`} {...props} />
)
export const SettingItemInfo = ({
  className,
  ...props
}: HTMLProps<HTMLDivElement>) => (
  <div className={`setting-item-info${className ? ' ' + className : ''}`} {...props} />
)
