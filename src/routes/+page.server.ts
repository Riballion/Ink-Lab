/*

export const actions = {
    discord: async ({ request }) => {
        const formData = await request.formData();
        const imageString = formData.get('image') as string;
        const text = formData.get('text') as string;
        const xHandle = formData.get('xHandle') as string;

        const base64Data = imageString.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        const webhookUrl = "https://discord.com/api/webhooks/1304100640321961984/IP3kaeFC5yzf33o1aEeP76ezwYncI8KHIm74QoFYKESeXopP3p77oRqflSATbwQDQpkU";
        if (!webhookUrl) {
            throw new Error('Discord webhook URL not configured');
        }

        try {
            const discordForm = new FormData();
            const filename = xHandle ? `${xHandle.replace('@', '')}_drawing.png` : 'drawing.png';
            discordForm.append('file', new Blob([imageBuffer], { type: 'image/png' }), filename);
            
            const content = text ? 
                `${xHandle ? `By ${xHandle}\n` : ''}${text}` : 
                `${xHandle ? `New drawing shared by ${xHandle}!` : 'New drawing shared!'}`;
            
            discordForm.append('content', content);

            const response = await fetch(webhookUrl, {
                method: 'POST',
                body: discordForm
            });

            if (!response.ok) {
                throw new Error('Failed to send to Discord');
            }

            return {
                success: true,
                message: 'Successfully shared to Discord!'
            };
        } catch (error) {
            console.error('Error sending to Discord:', error);
            return {
                success: false,
                message: 'Failed to share to Discord'
            };
        }
    }
}


*/