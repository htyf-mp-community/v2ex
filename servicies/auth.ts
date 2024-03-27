import { load } from 'cheerio'
import { isArray } from 'lodash'
import { router } from 'react-query-kit'

import { deletedNamesAtom } from '@/jotai/deletedNamesAtom'
import { store } from '@/jotai/store'
import { getCookie } from '@/utils/cookie'
import { BizError, request } from '@/utils/request'
import { paramsSerializer } from '@/utils/request/paramsSerializer'
import { sleep } from '@/utils/sleep'
import { getBaseURL } from '@/utils/url'

import { isLogined } from './helper'

export const authRouter = router(`auth`, {
  signout: router.mutation({
    mutationFn: async ({ once }: { once: string }) => {
      const { data } = await request.get(`/signout?once=${once}`, {
        responseType: 'text',
      })
      const $ = load(data)

      if (isLogined($)) {
        return Promise.reject(new Error('Failed to logout'))
      }
    },
  }),

  signinInfo: router.query({
    fetcher: async (_, { signal }) => {
      const { data } = await request.get(`/signin`, {
        responseType: 'text',
        signal,
      })
      const $ = load(data)

      const captcha = $('#captcha-image').attr('src')

      return {
        is_limit: !captcha,
        captcha: `${captcha}?now=${Date.now()}`,
        once: $(
          '#Main > div.box > div.cell > form > table > tbody > tr:nth-child(4) > td:nth-child(2) > input[type=hidden]:nth-child(1)'
        ).attr('value'),
        username_hash: $(
          '#Main > div.box > div.cell > form > table > tbody > tr:nth-child(1) > td:nth-child(2) > input'
        ).attr('name'),
        password_hash: $(
          '#Main > div.box > div.cell > form > table > tbody > tr:nth-child(2) > td:nth-child(2) > input'
        ).attr('name'),
        code_hash: $(
          '#Main > div.box > div.cell > form > table > tbody > tr:nth-child(3) > td:nth-child(2) > input'
        ).attr('name'),
        cookie: await getCookie(),
      }
    },
    gcTime: 0,
    staleTime: 0,
  }),

  signin: router.mutation({
    mutationFn: async ({
      username,
      ...args
    }: Record<string, any>): Promise<{
      '2fa'?: boolean
      once?: string
    }> => {
      if (await store.get(deletedNamesAtom)?.includes(username)) {
        await sleep(1000)
        return Promise.reject(new BizError('该帐号已注销'))
      }

      const { data } = await request.post('/signin', paramsSerializer(args), {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          Referer: `${getBaseURL()}/signin`,
          origin: getBaseURL(),
        },
      })

      const $ = load(data)

      if ($('#otp_code').length) {
        return {
          '2fa': true,
          once: $("input[name='once']").attr('value'),
        }
      }

      const problem = $(`#Main > div.box > div.problem > ul > li`)
        .eq(0)
        .text()
        .trim()

      if (isLogined($) && !problem) {
        return {}
      }

      return Promise.reject(
        new BizError(
          $('#captcha-image').attr('src')
            ? '登录失败'
            : '由于当前 IP 在短时间内的登录尝试次数太多，目前暂时不能继续尝试。'
        )
      )
    },
  }),

  twoStepSignin: router.mutation({
    mutationFn: async (args: {
      code: string
      once: string
    }): Promise<string> => {
      const { headers, data } = await request.post(
        '/2fa',
        paramsSerializer(args),
        {
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            Referer: `${getBaseURL()}/2fa`,
            origin: getBaseURL(),
          },
        }
      )

      const $ = load(data)

      const problem = $(`#Main > div.box > div.problem > ul > li`)
        .eq(0)
        .text()
        .trim()

      if (isLogined($) && !problem) {
        return isArray(headers['set-cookie'])
          ? headers['set-cookie'].join(';')
          : ''
      }

      return Promise.reject(new Error(`${problem || '登录失败'}`))
    },
  }),
})
