import { useLayoutEffect, useEffect } from 'react'
import { isServer } from '../constants'

export const useIsoMorphicEffect = isServer ? useEffect : useLayoutEffect
