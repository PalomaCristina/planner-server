import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { dayjs } from '../lib/dayjs'
import { ClientError } from '../errors/client-error'

export async function createActivity(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/tasks/:TaskId/activities',
    {
      schema: {
        params: z.object({
          TaskId: z.string().uuid(),
        }),
        body: z.object({
          title: z.string().min(4),
          occurs_at: z.coerce.date(),
        }),
      },
    },
    async (request) => {
      const { TaskId } = request.params
      const { title, occurs_at } = request.body

      const task = await prisma.task.findUnique({
        where: { id: TaskId }
      })

      if (!task) {
        throw new ClientError('Task not found')
      }

      if (dayjs(occurs_at).isBefore(task.starts_at)) {
        throw new ClientError('Invalid activity date.')
      }

      if (dayjs(occurs_at).isAfter(task.ends_at)) {
        throw new ClientError('Invalid activity date.')
      }

      const activity = await prisma.activity.create({
        data: {
          title,
          occurs_at,
          task_id: TaskId,
        }
      })

      return { activityId: activity.id }
    },
  )
}
