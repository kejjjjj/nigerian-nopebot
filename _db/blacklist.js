
import { Model, DataTypes } from 'sequelize';
import { sequelize } from './associations.js';


export class Blacklist extends Model
{
    static async BlockString(string){

        if(typeof(string) !== "string")
            throw `Blacklist::BlockString(): typeof(string) !== "string"`;

        if(await Blacklist.findOne({where: { blockedString: string }}))
            throw `'${string}' has already been blocked!`;

        await Blacklist.create({blockedString: string});
    }
    static async IsBlockedString(string){

        if(typeof(string) !== "string")
            throw `Blacklist::IncludesBlockedString(): typeof(string) !== "string"`;

        return !!(await Blacklist.findOne({where: { blockedString: string }}));
    }
    static async IncludesBlockedString(string){

        if(typeof(string) !== "string")
            throw `Blacklist::IncludesBlockedString(): typeof(string) !== "string"`;

        const bl = await Blacklist.findAll();

        if(!bl)
            return false;

        return !!bl.find(blacklist => string.includes(blacklist.blockedString));
    }

    static async UnblockString(string){

        if(typeof(string) !== "string")
            throw `Blacklist::BlockString(): typeof(string) !== "string"`;

        if(!await Blacklist.findOne({where: { blockedString: string }}))
            return;

        await Blacklist.destroy({
            where: { blockedString: string }, 
        });
    }
    
}

Blacklist.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        blockedString: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize
    }
);