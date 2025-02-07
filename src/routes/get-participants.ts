import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { dayjs } from '../lib/dayjs'
import { ClientError } from '../errors/client-error'

export async function getParticipants(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/tasks/:TaskId/participants',
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
          participants: {
            select: {
              id: true,
              name: true,
              email: true,
              is_confirmed: true,
            }
          },
        },
      })

      if (!task) {
        throw new ClientError('Task not found')
      }

      return { participants: task.participants }
    },
  )
}
