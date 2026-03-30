This stuff is truly hot off the presses.

In 2,017, um,

folks at Google, um,

proposed what is generally now called attention,

which is a feature that underlies AI,

whereby you can sort of figure out dynamically

what the relationship is between words in an English paragraph

or an English text or really any human language.

And giving weight to words in that way

has actually fed a lot of these new

large language models. In 2020,

did Open AI publish its GPT model,

and most recently, in 2022,

did chat GPT itself come out?

And what underlies what we're talking about here is technically

this big mouthful. Generative pre trained transformers.

Whereby the purpose of these AIs

is to generate stuff they've been pre trained on,

like lots of publicly available data.

And the goal is to transform the user's input into,

ideally correct output. And if you see where I'm going with this,

that's the GPT in chat GPT,

which itself was never meant to be like a branded product.

It's a little weird that GPT has entered the human vernacular,

but what it does is evokes exactly these ideas.

So here's a sample paragraph.

For instance, Massachusetts is a state

in the New England region of the northeastern United States.

It borders on the Atlantic Ocean to the east.

The state's capital is dot, dot, dot,

essentially inviting us to answer now this question.

Well, historically,

prior to 2,017 ish,

it was actually pretty hard for machines to learn that Oh,

this mention of Massachusetts

is actually related to this mention of state. Why?

Cause they're pretty far apart.

This isn't a whole new sentence.

And unless it knows already what Massachusetts is,

and technically it's a Commonwealth,

it might not give much attention to these two words,

too much weight to the relationship thereof.

But if you train these GPT's on enough data

and you start to break down the input into sequences of words,

for instance, well,

you might have a an array or a list of words here in CS fifty speak.

You might be able to figure out based on your training data

that if you number all of these words from like 1 to 27 or what not,

in this case you could represent them mathematically somehow.

As an aside,

the way that these large language models are representing words

like Massachusetts literally

is with numbers like this.

This is 15 36 floating point values in a vector, a.

K. A.

List or array. That literally represents the word Massachusetts

according to one of these algorithms.

Let's take a step back

and abstract it away as little rectangles instead

and use these little edges to imply that

if there's a bolder edge here,

that implies that there's really a relationship in the training data

between Massachusetts and state.

One of those words is giving more attention to the other

as opposed to is,

which is maybe a thin line because there's not much going on.

There between Massachusetts and is,

as opposed to those two nouns.

In that case, all of this input,

all of these vectors,

are fed into large neural networks that have lots and lots of inputs,

far more than one and two and three.

The output of which, ideally, then,

is the answer to this question,

or a whole answer to your question.

And so when you ask the duck a question,

you ask ChatGPT the question.

Essentially, the software is sort of navigating this neural network,

trying to find the best path through it

to give you the most correct answer.

{SOME ADDITIONAL CONTEXT TO THIS CONTEXT IN THE FORM OF A COMMENTOR}

"@Maggie: Yep! LLMs instantiate brain-like computation through prediction, attention, and hierarchical abstraction over context-aware embeddings. They learn by minimizing prediction error, refining meaning layer-by-layer, and choosing words via probabilistic decoding, very similar to human brains. That’s why they disambiguate bank vs. river bank, transfer across tasks, and pass high-level exams. Both humans and LLMs process and understand language the same way because their architecture was inspired by the human brain. Bio neural networks and artificial neural networks both operate in high-dimensional representational spaces. Meaning develops from distributed population codes, rather than single labeled units. Our manifolds preserve semantic geometry in ways that are mathematically analogous to embedding spaces in transformers. Generalization efficiency depends on local distances in that latent space for us AND for LLMs. Bio and artificial neural networks spontaneously organize and behave near identically. Predictive word modeling is a literally a mirror of what human brains do. Every time you listen to a sentence, your auditory cortex and language networks are running forward models, guessing the next sound, word, and meaning. That’s why you can understand someone even if half the words are drowned out by static because you’re filling in from prediction. Prediction is the basis of comprehension."
