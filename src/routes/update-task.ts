import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { dayjs } from '../lib/dayjs'
import { ClientError } from '../errors/client-error'

export async function updateTask(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    '/tasks/:TaskId',
    {
      schema: {
        params: z.object({
          TaskId: z.string().uuid(),
        }),
        body: z.object({
          destination: z.string().min(4),
          starts_at: z.coerce.date(),
          ends_at: z.coerce.date(),
        }),
      },
    },
    async (request) => {
      const { TaskId } = request.params
      const { destination, starts_at, ends_at } = request.body

      const task = await prisma.task.findUnique({
        where: { id: TaskId }
      })

      if (!task) {
        throw new ClientError('Task not found')
      }

      if (dayjs(starts_at).isBefore(new Date())) {
        throw new ClientError('Invalid task start date.')
      }

      if (dayjs(ends_at).isBefore(starts_at)) {
        throw new ClientError('Invalid task end date.')
      }

      await prisma.task.update({
        where: { id: TaskId },
        data: {
          destination,
          starts_at,
          ends_at,
        },
      })

      return { TaskId: task.id }
    },
  )
}
