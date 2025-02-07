import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { ClientError } from '../errors/client-error'

export async function getLinks(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/tasks/:TaskId/links',
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
          links: true,
        },
      })

      if (!task) {
        throw new ClientError('Task not found')
      }

      return { links: task.links }
    },
  )
}
