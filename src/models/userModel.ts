import { Prisma } from "../generated/prisma/client"
import { prisma } from "../libs/prisma"

export const getUniqueUser = async (condition:Prisma.UserWhereUniqueInput) => {
    return await prisma.user.findUnique({
        where: condition
    })
}

export const getAllUser = async (limit = 50, cursor?: string, codition?: Prisma.UserWhereInput) => {
    return await prisma.user.findMany({
        cursor: {
            id: cursor
        },
        take: limit,
        where: codition,
        omit: {
            password: true
        }
    })
}

export const createUser = async (data: Prisma.UserCreateInput) => {
    return await prisma.user.create({
        data
    })
}

export const updateUser = async (data: Prisma.UserUpdateInput, id: string) => {
    return await prisma.user.update({
        data,
        where: {
            id
        }
    })
}

export const deleteuser = async (id: string) => {
    return await prisma.user.delete({
        where: {
            id
        }
    })
}