router.put("/copies/:id", async (req, res) => {

    try {

        await db.query(

            `UPDATE dataframe_copies
            SET name=?
            WHERE id=? AND user_id=?`,

            [
                req.body.name,
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
