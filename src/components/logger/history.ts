/**********************************************************************************
 * MIT License                                                                    *
 *                                                                                *
 * Copyright (c) 2021 Hyperjump Technology                                        *
 *                                                                                *
 * Permission is hereby granted, free of charge, to any person obtaining a copy   *
 * of this software and associated documentation files (the "Software"), to deal  *
 * in the Software without restriction, including without limitation the rights   *
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell      *
 * copies of the Software, and to permit persons to whom the Software is          *
 * furnished to do so, subject to the following conditions:                       *
 *                                                                                *
 * The above copyright notice and this permission notice shall be included in all *
 * copies or substantial portions of the Software.                                *
 *                                                                                *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR     *
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,       *
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE    *
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER         *
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,  *
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE  *
 * SOFTWARE.                                                                      *
 **********************************************************************************/

import { AxiosResponseWithExtraData } from '../../interfaces/request'
import { Probe } from '../../interfaces/probe'
import path from 'path'
import { log } from '../../utils/pino'

const sqlite3 = require('sqlite3').verbose()

export type HistoryLogType = {
  id: number
  probeID: string
  statusCode: number
  probeURL: string
  responseTime: number
}

export type HistoryReportLogType = HistoryLogType & {
  id: number
  created_at: string
  probe_id: string
  status_code: number
  probe_name: string
  probe_url: string
  response_time: number
  error_resp: string
}

let db: any

/**
 * createTable will create the history table if it does not exist
 */
async function createTable() {
  const createTableSQL = `CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY,
    created_at TEXT,
    probe_id TEXT,
    status_code INTEGER,
    probe_name TEXT,
    probe_url TEXT,
    response_time INTEGER,
    error_resp TEXT,
    reported INTEGER DEFAULT 0
);`
  db.run(createTableSQL)
}

/**
 * openLogfile will open the file history.db and if it doesnt exist, create it and sets up the table
 */
export async function openLogfile() {
  const dbPath = path.resolve(process.cwd(), 'monika-logs.db')

  db = new sqlite3.Database(
    dbPath,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    async (err: Error) => {
      if (err) {
        log.info('warning: cannot open logfile. error:', err.message)
      }
      createTable()
    }
  )
}

/**
 * getAllLogs gets all the history table from sqlite db
 * @returns {obj} result of logs table
 */
export const getAllLogs = (): Promise<HistoryLogType[]> => {
  const readRowsSQL =
    'SELECT rowid AS id, probe_id, status_code, probe_url, response_time FROM history'

  const res: Promise<HistoryLogType[]> = new Promise((resolve, reject) => {
    db.all(readRowsSQL, (err: Error, data: HistoryLogType[]) => {
      if (err) return reject(err)

      return resolve(data)
    })
  })
  return res
}

export const getUnreportedLogs = () => {
  const readRowsSQL =
    'SELECT id, created_at, probe_id, status_code, probe_name, probe_url, response_time, error_resp FROM history WHERE reported = 0'

  return new Promise<HistoryReportLogType[]>((resolve, reject) => {
    db.all(readRowsSQL, (err: Error, data: HistoryReportLogType[]) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}

export const setLogsAsReported = (ids: number[]) => {
  const updateRowsSQL = `UPDATE history SET reported = 1 WHERE id IN (${ids.join(
    ', '
  )})`

  return new Promise<void>((resolve, reject) => {
    db.run(updateRowsSQL, (err: Error) => {
      if (err)
        reject(
          new Error(
            'error, cannot mark logs as updated in history.db: ' + err?.message
          )
        )
      else resolve()
    })
  })
}

/**
 * flushAllLogs drops the table and recreates it
 */
export async function flushAllLogs() {
  const dropTableSQL = 'DROP TABLE IF EXISTS history'

  await db.run(dropTableSQL)
  createTable()
}

/**
 * saveLog inserts log information into the table oclumns
 *
 * @param {object} probe is the probe config
 * @param {object} probeRes this is the response time of the probe
 * @param {number} requestIndex is the request index from a probe
 * @param {string} errorResp if there was an error, it will be stored here
 */
export async function saveLog(
  probe: Probe,
  probeRes: AxiosResponseWithExtraData,
  requestIndex: number,
  errorResp: string
) {
  const insertSQL = `INSERT into history (probe_id, created_at, status_code, probe_name, probe_url, response_time, error_resp) 
  VALUES(?, ?, ?, ?, ?, ?, ?);`

  const created = new Date().toISOString()

  const params = [
    probe.id,
    created,
    probeRes.status,
    probe.name,
    probeRes.config.url,
    probeRes.config.extraData?.responseTime,
    errorResp,
  ]

  await db.run(insertSQL, params, (err: Error) => {
    if (err) {
      return log.info('error, cannot insert data into history.db', err)
    }
  })
}

/**
 * closeDB closes the database
 */
export function closeLog() {
  db.close()
}