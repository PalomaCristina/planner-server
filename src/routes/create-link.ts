import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { ClientError } from '../errors/client-error'

export async function createLink(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/tasks/:TaskId/links',
    {
      schema: {
        params: z.object({
          TaskId: z.string().uuid(),
        }),
        body: z.object({
          title: z.string().min(4),
          url: z.string().url(),
        }),
      },
    },
    async (request) => {
      const { TaskId } = request.params
      const { title, url } = request.body

      const task = await prisma.task.findUnique({
        where: { id: TaskId }
      })

      if (!task) {
        throw new ClientError('Task not found')
      }

      const link = await prisma.link.create({
        data: {
          title,
          url,
          task_id: TaskId,
        }
      })

      return { linkId: link.id }
    },
  )
}
