
import { Model, DataTypes } from 'sequelize';
import { sequelize } from './associations.js';

export class Discord extends Model
{
    static async Init()
    {
        if(await Discord.count() >= 1)
            return;

        await Discord.create({
                personality: "a somewhat clueless person who speaks poor english - showing a lot of interest towards whatever they are offering"
            });
        
        console.log("Discord DB initialized");
    }

    static async Get()
    {
        const table = await Discord.findOne({
            order: [['id', 'ASC']]
          });

        return table;
    }
    
    static async SetPersonality(personality)
    {
        const instance = await Discord.Get();

        if(!instance)
            throw "SetPersonality(): !instance";

        if(typeof(personality) !== "string")
            throw "SetPersonality(): typeof(personality) !== 'string'";

        instance.personality = personality;
        await instance.save();
    }

    static async GetPersonality()
    {
        const instance = await Discord.Get();

        if(!instance)
            throw "SetPersonality(): !instance";

        return instance.personality;
    }

}


Discord.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        personality: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize
    }
);