import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { dayjs } from '../lib/dayjs'
import { ClientError } from '../errors/client-error'

export async function getActivities(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/tasks/:TaskId/activities',
    {
      schema: {
        params: z.object({
          TaskId: z.string().uuid(),
        }),
      },
    },
    async (request) => {
      const { TaskId } = request.params

      const task = await prisma.task.findUnique({
        where: { id: TaskId },
        include: { 
          activities: {
            orderBy: {
              occurs_at: 'asc',
            }
          } 
        },
      })

      if (!task) {
        throw new ClientError('Task not found')
      }

      const differenceInDaysBetweenTaskStartAndEnd = dayjs(task.ends_at).diff(task.starts_at, 'days')

      const activities = Array.from({ length: differenceInDaysBetweenTaskStartAndEnd + 1 }).map((_, index) => {
        const date = dayjs(task.starts_at).add(index, 'days')

        return {
          date: date.toDate(),
          activities: task.activities.filter(activity => {
            return dayjs(activity.occurs_at).isSame(date, 'day')
          })
        }
      })

      return { activities }
    },
  )
}
