import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { ClientError } from '../errors/client-error'

export async function getTaskDetails(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/tasks/:TaskId',
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
        select: {
          id: true,
          destination: true,
          starts_at: true,
          ends_at: true,
          is_confirmed: true,
        },
        where: { id: TaskId },
      })

      if (!task) {
        throw new ClientError('Task not found')
      }

      return { task }
    },
  )
}
