router.delete("/copies/:id", async (req, res) => {

    try {

        await db.query(

            `DELETE FROM dataframe_copies
            WHERE id=? AND user_id=?`,

            [
                req.params.id,
                req.session.user.id
            ]

        );

        res.json({
            success: true
        });

    } catch (err) {

        console.error(err);

        res.sendStatus(500);

    }

});
