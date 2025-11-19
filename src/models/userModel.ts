import { prisma } from "../libs/prisma"

const getUniqueUser = async (id: string) => {
    await prisma.user.findUnique({
        where: { id }
    })
}