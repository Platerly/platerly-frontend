// src/hooks/useSoftWall.js
import { useEffect, useState } from 'react'
import {
  SOFT_WALL_ENABLED,
  SOFT_WALL_DAILY_LIMIT,
  SOFT_WALL_MIN_UNIQUE_DAYS,
  SOFT_WALL_COOLDOWN_MS,
  SOFT_WALL_ROLLING_WINDOW_MS,
  SOFT_WALL_KEYS
} from '../config/softWall'
import { useAuth } from '../context/AuthContext'



function now() { return Date.now() }
function toYMD(ts) { return new Date(ts).toISOString().slice(0,10) }
function parseJSON(raw, fallback) { try { return JSON.parse(raw) } catch { return fallback } }

function readArray(key) { return parseJSON(localStorage.getItem(key) || '[]', []) }
function writeArray(key, arr) { localStorage.setItem(key, JSON.stringify(arr)) }

function withinRollingWindow(t) { return (now() - t) <= SOFT_WALL_ROLLING_WINDOW_MS }

export function useSoftWall(viewToken) {
  const { user } = useAuth()
  const isGuest = !user

  const [show, setShow] = useState(false)
  const [viewsInWindow, setViewsInWindow] = useState(0)

  useEffect(() => {
    if (!SOFT_WALL_ENABLED || !isGuest) return

    // 1) Unique view counting by token
    if (viewToken) {
      const seen = new Set(readArray(SOFT_WALL_KEYS.seenTokens))
      if (!seen.has(viewToken)) {
        seen.add(viewToken)
        writeArray(SOFT_WALL_KEYS.seenTokens, [...seen])

        // Append timestamp to viewsLog
        const log = readArray(SOFT_WALL_KEYS.viewsLog)
        log.push(now())
        writeArray(SOFT_WALL_KEYS.viewsLog, log)
      }
    }

    // 2) Maintain rolling 24h window count
    const log = readArray(SOFT_WALL_KEYS.viewsLog).filter(withinRollingWindow)
    writeArray(SOFT_WALL_KEYS.viewsLog, log) // purge old
    setViewsInWindow(log.length)

    // 3) Track unique days seen (for return-visit prompting)
    const daysSeen = new Set(readArray(SOFT_WALL_KEYS.daysSeen))
    daysSeen.add(toYMD(now()))
    writeArray(SOFT_WALL_KEYS.daysSeen, [...daysSeen])

    // 4) Cooldown check
    const dismissedAt = parseInt(localStorage.getItem(SOFT_WALL_KEYS.dismissedAt) || '0', 10)
    const underCooldown = dismissedAt && (now() - dismissedAt) < SOFT_WALL_COOLDOWN_MS

    // 5) Prompt criteria
    const hitDailyLimit = log.length >= SOFT_WALL_DAILY_LIMIT
    const hitReturnVisit = daysSeen.size >= SOFT_WALL_MIN_UNIQUE_DAYS

    setShow(!underCooldown && (hitDailyLimit || hitReturnVisit))
  }, [isGuest, viewToken])

  const dismiss = () => {
    localStorage.setItem(SOFT_WALL_KEYS.dismissedAt, String(now()))
    setShow(false)
  }

  return {
    isGuest,
    showSoftWall: show,
    dismissSoftWall: dismiss,
    viewsInWindow,
    dailyLimit: SOFT_WALL_DAILY_LIMIT
  }
}
