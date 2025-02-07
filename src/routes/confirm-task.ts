import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import nodemailer from 'nodemailer'
import { z } from 'zod'
import { dayjs } from '../lib/dayjs'
import { getMailClient } from '../lib/mail'
import { prisma } from '../lib/prisma'
import { ClientError } from '../errors/client-error'
import { env } from '../env'

export async function confirmTask(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/tasks/:taskId/confirm',
    {
      schema: {
        params: z.object({
          taskId: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { taskId } = request.params

      const task = await prisma.task.findUnique({
        where: {
          id: taskId,
        },
        include: {
          participants: {
            where: {
              is_owner: false,
            }
          }
        }
      })

      if (!task) {
        throw new ClientError('Task not found.')
      }

      if (task.is_confirmed) {
        return reply.redirect(`${env.WEB_BASE_URL}/tasks/${taskId}`)
      }

      await prisma.task.update({
        where: { id: taskId },
        data: { is_confirmed: true },
      })

      const formattedStartDate = dayjs(task.starts_at).format('LL')
      const formattedEndDate = dayjs(task.ends_at).format('LL')

      const mail = await getMailClient()

      await Promise.all(
        task.participants.map(async (participant: any) => {
          const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`

          const message = await mail.sendMail({
            from: {
              name: 'Equipe plann.er',
              address: 'oi@plann.er',
            },
            to: participant.email,
            subject: `Confirme sua presença na viagem para ${task.destination} em ${formattedStartDate}`,
            html: `
            <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
              <p>Você foi convidado(a) para participar de uma viagem para <strong>${task.destination}</strong> nas datas de <strong>${formattedStartDate}</strong> até <strong>${formattedEndDate}</strong>.</p>
              <p></p>
              <p>Para confirmar sua presença na viagem, clique no link abaixo:</p>
              <p></p>
              <p>
                <a href="${confirmationLink}">Confirmar viagem</a>
              </p>
              <p></p>
              <p>Caso você não saiba do que se trata esse e-mail, apenas ignore esse e-mail.</p>
            </div>
          `.trim(),
          })
    
          console.log(nodemailer.getTestMessageUrl(message))
        })
      )

      return reply.redirect(`${env.WEB_BASE_URL}/tasks/${taskId}`)
    },
  )
}
