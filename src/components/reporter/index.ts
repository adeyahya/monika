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

import os from 'os'
import axios from 'axios'
import pako from 'pako'

import { Config } from '../../interfaces/config'
import {
  getUnreportedLogs,
  setNotificationLogAsReported,
  setRequestLogAsReported,
  UnreportedNotificationsLog,
  UnreportedRequestsLog,
} from '../logger/history'
import { log } from '../../utils/pino'
import { md5Hash } from '../../utils/hash'
import { getConfig } from '../config'

export interface SymonConfig {
  id: string
  url: string
  key: string
  interval?: number
}

export type SymonResponse = {
  result: string
  message: string
}

export const handshake = (config: Config): Promise<SymonResponse> => {
  return axios
    .post(
      `${config.symon!.url}/handshake`,
      {
        instanceId: config.symon!.id,
        hostname: os.hostname(),
      },
      {
        headers: {
          'x-api-key': config.symon!.key,
        },
      }
    )
    .then((res) => res.data)
}

export const report = ({
  url,
  key,
  instanceId,
  configVersion,
  data,
}: {
  url: string
  key: string
  instanceId: string
  configVersion: string
  data: {
    requests: Omit<UnreportedRequestsLog, 'id'>[]
    notifications: Omit<UnreportedNotificationsLog, 'id'>[]
  }
}): Promise<SymonResponse> => {
  return axios
    .post(
      `${url}/report`,
      {
        monika_instance_id: instanceId,
        config_version: configVersion,
        data,
      },
      {
        headers: {
          'Content-Encoding': 'gzip',
          'Content-Type': 'application/json',
          'x-api-key': key,
        },
        transformRequest: (data) => pako.gzip(JSON.stringify(data)).buffer,
      }
    )
    .then((res) => res.data)
}

export const getLogsAndReport = async () => {
  const config = getConfig()

  if (config.symon) {
    const { url, key, id: instanceId } = config.symon

    try {
      const unreportedLog = await getUnreportedLogs()
      const requests = unreportedLog.requests.map(({ id: _, ...rest }) => rest)
      const notifications = unreportedLog.notifications.map(
        ({ id: _, ...rest }) => rest
      )

      await report({
        url,
        key,
        instanceId,
        configVersion: config.version || md5Hash(config),
        data: { requests, notifications },
      })

      await Promise.all([
        setRequestLogAsReported(unreportedLog.requests.map((log) => log.id)),
        setNotificationLogAsReported(
          unreportedLog.notifications.map((log) => log.id)
        ),
      ])
    } catch (error) {
      log.warn(" ›   Warning: Can't report history to Symon. " + error.message)
    }
  }
}
