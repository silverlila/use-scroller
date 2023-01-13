import { useLayoutEffect, useEffect } from 'react'
import { isServer } from '../utils'

export const useIsoMorphicEffect = isServer ? useEffect : useLayoutEffect
